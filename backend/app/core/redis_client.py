import redis
from functools import lru_cache

from app.core.config import get_settings

@lru_cache
def get_redis_client() -> redis.Redis:
    """
    Return singletone Redis-client for app
    """
    settings = get_settings()
    return redis.Redis.from_url(
        str(settings.redis_url),
        decode_responses=True,
    )
