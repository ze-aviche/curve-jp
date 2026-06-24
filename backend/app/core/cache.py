"""
Redis cache helper.

SCALE PATTERN — CACHE-ASIDE:
Expensive, repeatable reads (an audit result, a vendor list) shouldn't hit the
DB/LLM every time. Cache-aside: check Redis first; on miss, compute and store
with a TTL. A *shared* Redis cache (not in-process) means every web replica sees
the same cached value — essential once you run more than one API container.

Degrades gracefully: if Redis is down or unset, we just compute every time
rather than failing the request.
"""
from __future__ import annotations

import json
from typing import Any, Awaitable, Callable

import redis.asyncio as aioredis

from app.core.config import settings

_redis: aioredis.Redis | None = None


def _client() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        try:
            _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception:  # noqa: BLE001
            return None
    return _redis


async def cached(key: str, producer: Callable[[], Awaitable[Any]], ttl: int | None = None) -> Any:
    """Return cached value for `key`, else run `producer()`, store, and return."""
    ttl = ttl if ttl is not None else settings.CACHE_TTL_SECONDS
    client = _client()
    if client is not None:
        try:
            hit = await client.get(key)
            if hit is not None:
                return json.loads(hit)
        except Exception:  # noqa: BLE001 - cache must never break the request
            client = None

    value = await producer()

    if client is not None:
        try:
            await client.set(key, json.dumps(value), ex=ttl)
        except Exception:  # noqa: BLE001
            pass
    return value


async def ping() -> bool:
    client = _client()
    if client is None:
        return False
    try:
        return bool(await client.ping())
    except Exception:  # noqa: BLE001
        return False
