"""
In-process event bus (publish/subscribe).

EVENT-DRIVEN INTEGRATION:
Connectors and the audit pipeline shouldn't call each other directly — that
couples them. Instead they communicate through events: a connector publishes
`integration.synced`; whoever cares (e.g. a handler that kicks off a re-audit,
or an audit-log writer) subscribes. Add a new reaction = add a subscriber,
touch no existing code.

This implementation is a simple in-process async bus — the right shape for a
local/learning setup. In production you swap the internals for Redis Streams,
SNS/SQS, or Kafka while keeping the same `publish` / `subscribe` API: the
publishers and subscribers never know the difference. That swap-the-transport,
keep-the-contract idea is the whole point.
"""
from __future__ import annotations

import asyncio
import inspect
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

Handler = Callable[["Event"], Awaitable[None] | None]


@dataclass
class Event:
    type: str
    payload: dict[str, Any] = field(default_factory=dict)


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, event_type: str, handler: Handler) -> None:
        self._subscribers[event_type].append(handler)

    async def publish(self, event: Event) -> None:
        """Fan out to all subscribers. Sync and async handlers both supported.

        Handlers are isolated: one raising doesn't stop the others (an event
        bus must not let a flaky subscriber break the publisher).
        """
        for handler in self._subscribers.get(event.type, []):
            try:
                result = handler(event)
                if inspect.isawaitable(result):
                    await result
            except Exception as e:  # noqa: BLE001 - bus must stay resilient
                print(f"[event-bus] handler for '{event.type}' failed: {e}")


# Module-level singleton bus.
bus = EventBus()
