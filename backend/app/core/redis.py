import json
import logging
import time
from typing import Any, Optional
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")
redis_client: Optional[Any] = None


class MockRedis:
    """In-memory fallback when Redis server is unavailable."""

    def __init__(self):
        self.data = {}
        self.expiry = {}

    async def get(self, key: str) -> Optional[str]:
        if key in self.expiry and time.time() > self.expiry[key]:
            self.data.pop(key, None)
            self.expiry.pop(key, None)
            return None
        return self.data.get(key)

    async def set(
        self,
        key: str,
        value: str,
        px: Optional[int] = None,
        ex: Optional[int] = None,
    ) -> bool:
        self.data[key] = value
        if px:
            self.expiry[key] = time.time() + (px / 1000.0)
        elif ex:
            self.expiry[key] = time.time() + ex
        return True

    async def incr(self, key: str) -> int:
        current = await self.get(key)
        next_val = (int(current) if current and str(current).isdigit() else 0) + 1
        self.data[key] = str(next_val)
        return next_val

    async def delete(self, *keys: str) -> int:
        removed = 0
        for key in keys:
            if key in self.data:
                removed += 1
            self.data.pop(key, None)
            self.expiry.pop(key, None)
        return removed

    async def ping(self):
        return True

    async def close(self):
        pass


async def init_redis():
    global redis_client
    if redis_client is None:
        try:
            client = redis.from_url(
                settings.get_redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            await client.ping()
            redis_client = client
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}. Falling back to In-Memory simulation.")
            redis_client = MockRedis()
    return redis_client


async def get_redis():
    global redis_client
    if redis_client is None:
        return await init_redis()
    return redis_client


async def close_redis():
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None


async def get_redis_status() -> str:
    client = await get_redis()
    if isinstance(client, MockRedis):
        return "fallback"
    try:
        await client.ping()
        return "connected"
    except Exception:
        return "error"


async def cache_get_json(key: str) -> Optional[Any]:
    try:
        client = await get_redis()
        raw = await client.get(key)
        if not raw:
            return None
        return json.loads(raw)
    except Exception:
        return None


async def cache_set_json(key: str, value: Any, ttl_seconds: int) -> None:
    try:
        client = await get_redis()
        await client.set(key, json.dumps(value), ex=ttl_seconds)
    except Exception:
        pass


async def get_cache_version(namespace: str) -> str:
    try:
        client = await get_redis()
        ver = await client.get(f"cache:ver:{namespace}")
        return ver or "0"
    except Exception:
        return "0"


async def bump_cache_version(namespace: str) -> None:
    try:
        client = await get_redis()
        await client.incr(f"cache:ver:{namespace}")
    except Exception:
        pass


async def invalidate_catalog_cache() -> None:
    await bump_cache_version("catalog")


async def invalidate_store_info_cache() -> None:
    await bump_cache_version("store_info")


async def invalidate_analytics_cache() -> None:
    await bump_cache_version("analytics")
