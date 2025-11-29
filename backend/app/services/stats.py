from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

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

    # --- set range if parameters is None
    now = datetime.now(timezone.utc)

    if to_ts is None:
        to_ts = now
    if from_ts is None:
        from_ts = to_ts - timedelta(hours=24)

    # --- query for results in range
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
    avg_response_time_ms: float | None
    if response_times:
        avg_response_time_ms = sum(response_times) / len(response_times)
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

    return MonitorStats(
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











