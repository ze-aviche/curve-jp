"""
Redis Streams event bus — the production transport.

SCALE PATTERN — SAME CONTRACT, DIFFERENT TRANSPORT:
This implements the exact same `publish` / `subscribe` surface as the in-process
EventBus, but durably, across processes. Publishers (the API) XADD to a Redis
stream; a separate worker process consumes via a consumer group and dispatches
to subscribers. That decoupling is what lets you scale the web tier and the
worker tier independently, survive a worker restart (the stream persists), and
process events at-least-once with acknowledgements.

Consumer groups give you:
  - load balancing: N workers in one group split the stream
  - durability: unacked messages are redelivered (XPENDING/XCLAIM) after a crash
  - replay: the stream retains history for late/replacement consumers

The audit pipeline never learns it's on Redis — that's the whole point.
"""
from __future__ import annotations

import inspect
import json
from collections import defaultdict

import redis.asyncio as aioredis

from app.events.bus import Event, Handler

STREAM = "events"
GROUP = "workers"


class RedisEventBus:
    def __init__(self, url: str, consumer_name: str = "worker-1") -> None:
        self._redis = aioredis.from_url(url, decode_responses=True)
        self._consumer = consumer_name
        self._subscribers: dict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, event_type: str, handler: Handler) -> None:
        self._subscribers[event_type].append(handler)

    async def publish(self, event: Event) -> None:
        # One stream, type carried as a field — simple and replayable.
        await self._redis.xadd(
            STREAM, {"type": event.type, "payload": json.dumps(event.payload)}
        )

    async def ensure_group(self) -> None:
        """Create the consumer group if it doesn't exist (idempotent)."""
        try:
            await self._redis.xgroup_create(STREAM, GROUP, id="0", mkstream=True)
        except aioredis.ResponseError as e:
            if "BUSYGROUP" not in str(e):  # already exists is fine
                raise

    async def consume_forever(self, block_ms: int = 5000) -> None:
        """Worker loop: read, dispatch, acknowledge."""
        await self.ensure_group()
        while True:
            resp = await self._redis.xreadgroup(
                GROUP, self._consumer, {STREAM: ">"}, count=10, block=block_ms
            )
            if not resp:
                continue
            for _stream, messages in resp:
                for msg_id, fields in messages:
                    await self._dispatch(fields)
                    await self._redis.xack(STREAM, GROUP, msg_id)  # at-least-once

    async def _dispatch(self, fields: dict) -> None:
        event = Event(type=fields["type"], payload=json.loads(fields.get("payload", "{}")))
        for handler in self._subscribers.get(event.type, []):
            try:
                result = handler(event)
                if inspect.isawaitable(result):
                    await result
            except Exception as e:  # noqa: BLE001 - a bad handler must not stall the worker
                print(f"[redis-bus] handler for '{event.type}' failed: {e}")
