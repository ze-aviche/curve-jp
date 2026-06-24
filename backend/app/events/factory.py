"""
Bus factory — pick the event-bus transport from config.

EVENT_BUS_BACKEND=memory  -> in-process (local dev, tests, single process)
EVENT_BUS_BACKEND=redis   -> Redis Streams (containers, multi-process, scale)

Callers depend on `get_bus()`, never on a concrete bus. Flipping one env var
moves the whole platform from single-process to a scalable web+worker topology
with no code change.
"""
from __future__ import annotations

from app.core.config import settings
from app.events.bus import bus as memory_bus

_redis_bus = None


def get_bus():
    global _redis_bus
    if settings.EVENT_BUS_BACKEND == "redis":
        if _redis_bus is None:
            from app.events.redis_bus import RedisEventBus

            _redis_bus = RedisEventBus(settings.REDIS_URL)
        return _redis_bus
    return memory_bus
