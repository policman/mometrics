import time
import httpx
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.redis_client import get_redis_client
from app.crud.check_result import create_check_result
from app.models.monitor import Monitor as MonitorModel

logger = logging.getLogger("app.monitoring")

async def perform_http_check(target_url: str, timeout: float = 10.0) -> dict:
    start = time.monotonic()
    status_code = None
    error_message = None
    is_up = False
    response_time_ms = None

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(target_url)

        elapsed_ms = int((time.monotonic() - start) * 1000.0)
        response_time_ms = elapsed_ms
        status_code = response.status_code
        is_up = 200 <= response.status_code < 400

    except httpx.RequestError as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000.0)
        response_time_ms = elapsed_ms
        error_message = str(exc)
        is_up = False

    if error_message:
        logger.warning(
            "Monitor check failed: url=%s error=%s response_time_ms=%s",
            target_url, error_message, response_time_ms,
        )
    else:
        logger.info(
            "Monitor check OK: url=%s status=%s response_time_ms=%s",
            target_url, status_code, response_time_ms,
        )

    return {
        "is_up": is_up,
        "status_code": status_code,
        "response_time_ms": response_time_ms,
        "error_message": error_message,
    }

async def check_monitor_once(db: AsyncSession, monitor: MonitorModel):
    result_data = await perform_http_check(monitor.target_url)

    result = await create_check_result(
        db=db,
        monitor_id=monitor.id,
        is_up=result_data["is_up"],
        status_code=result_data["status_code"],
        response_time_ms=result_data["response_time_ms"],
        error_message=result_data["error_message"]
    )

    redis_client = get_redis_client()
    cache_key = f"monitor:{monitor.id}:stats:last_24h"
    try:
        await redis_client.delete(cache_key)
    except Exception as exc:
        logger.warning(f"Failed to invalidate stats cache: {exc}")

    return result