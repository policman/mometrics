from datetime import datetime, timedelta, timezone
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.redis_client import get_redis_client
from app.models import CheckResult
from app.schemas.monitor import MonitorStats


def compute_monitor_stats(
    db: Session,
    monitor_id,
    *,
    from_ts: datetime | None = None,
    to_ts: datetime | None = None
) -> MonitorStats:
    """
    Calculate stats of monitor's checks for period.
    if from_ts / to_ts is None - period = last 24 hours
    """
    settings = get_settings()
    redis_client = get_redis_client()

    # --- set range if parameters is None
    now = datetime.now(timezone.utc)

    use_cache = from_ts is None and to_ts is None

    if to_ts is None:
        to_ts = now
    if from_ts is None:
        from_ts = to_ts - timedelta(hours=24)

    cache_key = f"monitor:{monitor_id}:stats:last_24h"

    # 1 - try to get of cache
    if use_cache:
        cached = redis_client.get(cache_key)
        if cached:
            data = json.loads(cached)
            return MonitorStats(**data)

    # 2 - query for results in range (from db)
    base_q = (
        select(CheckResult)
        .where(
            CheckResult.monitor_id == monitor_id,
            CheckResult.checked_at >= from_ts,
            CheckResult.checked_at <= to_ts
        )
        .order_by(CheckResult.checked_at.desc())
    )

    results = db.scalars(base_q).all()

    total_checks = len(results)
    up_checks = sum(1 for r in results if r.is_up)
    down_checks = total_checks - up_checks

    uptime_percent = (up_checks / total_checks * 100.0) if total_checks > 0 else 0.0

    # --- average response time in range
    response_times = [r.response_time_ms for r in results if r is not None]
    if response_times:
        avg_response_time_ms: float | None = sum(response_times) / len(response_times)
    else:
        avg_response_time_ms = None

    # --- last result
    if results:
        last = results[0]
        last_status_up = last.is_up
        last_status_code = last.status_code
        last_check_at = last.checked_at
    else:
        last_status_up = last_status_code = last_check_at = None

    stats = MonitorStats(
        monitor_id=str(monitor_id),
        from_ts=from_ts,
        to_ts=to_ts,
        total_checks=total_checks,
        up_checks=up_checks,
        down_checks=down_checks,
        uptime_percent=uptime_percent,
        avg_response_time_ms=avg_response_time_ms,
        last_status_up=last_status_up,
        last_status_code=last_status_code,
        last_check_at=last_check_at
    )

    # 3 - put in cache (if period is default)
    if use_cache:
        redis_client.setex(
            cache_key,
            settings.cache_ttl_monitor_stats_sec,
            stats.model_dump_json(),
        )

    return stats










