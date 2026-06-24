"""
Background worker process.

SCALE PATTERN — SEPARATE WORKER TIER:
The web tier (uvicorn) must answer HTTP fast and never block on a 60-second,
4-LLM-call audit. So heavy/slow work is offloaded: the API publishes an event,
and this worker — a *separate process you scale independently* — consumes it
and does the expensive work. In containers you run N replicas of this worker;
the Redis consumer group load-balances the stream across them.

Run (with EVENT_BUS_BACKEND=redis and Redis reachable):
    python -m app.worker
"""
from __future__ import annotations

import asyncio

import app.integrations  # noqa: F401  registers connectors (handlers may need them)
from app.events.bus import Event
from app.events.redis_bus import RedisEventBus
from app.core.config import settings


async def on_integration_synced(event: Event) -> None:
    """React to a fresh source sync.

    In a fuller build this would enqueue a re-audit for the affected client(s)
    via `app.agents.run_audit`. Kept as a logging handler here so the worker is
    runnable without an API key; the wiring (event -> heavy work) is the lesson.
    """
    p = event.payload
    print(f"[worker] integration.synced: connector={p.get('connector')} "
          f"ingested={p.get('ingested')} index_total={p.get('index_total')}")
    # e.g. await run_audit(client_data, client_context)  # heavy, off the web tier


async def main() -> None:
    if settings.EVENT_BUS_BACKEND != "redis":
        print("[worker] EVENT_BUS_BACKEND is not 'redis'; the worker only consumes "
              "the Redis Streams bus. Set EVENT_BUS_BACKEND=redis.")
        return
    bus = RedisEventBus(settings.REDIS_URL, consumer_name="worker-1")
    bus.subscribe("integration.synced", on_integration_synced)
    print("[worker] consuming Redis stream 'events' (group 'workers')...")
    await bus.consume_forever()


if __name__ == "__main__":
    asyncio.run(main())
