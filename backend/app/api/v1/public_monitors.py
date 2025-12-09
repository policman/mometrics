from datetime import datetime, timedelta, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.crud.check_result import get_checks_in_period
from app.crud.public_monitor import get_public_monitors_for_project, get_public_monitor
from app.db.session import get_async_db
from app.schemas.check_result import CheckResultRead
from app.schemas.monitor import MonitorStats
from app.schemas.public_monitor import PublicMonitorRead
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.stats import compute_monitor_stats

router = APIRouter(prefix="/public", tags=["public monitors"])

@router.get("/projects/{project_id}/monitors", response_model=list[PublicMonitorRead])
async def get_public_monitors_for_project_endpoint(
    project_id: uuid.UUID,
    limit: int = 20,
    skip: int = 0,
    db: AsyncSession = Depends(get_async_db)
) -> list[PublicMonitorRead]:
    monitors = await get_public_monitors_for_project(project_id, limit, skip, db)

    if not monitors:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found monitors"
        )

    return monitors

@router.get("/monitors/{monitor_id}", response_model=PublicMonitorRead)
async def get_public_monitor_endpoint(
    monitor_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
) -> PublicMonitorRead:
    monitor = await get_public_monitor(monitor_id, db)
    if not monitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found")

    return monitor

@router.get("/monitors/{monitor_id}/stats", response_model=MonitorStats)
async def get_public_monitor_stats(
    monitor_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db),
    from_ts: datetime | None = Query(None, description="Start of interval (UTC)"),
    to_ts: datetime | None = Query(None, description="End of interval (UTC)")
) -> MonitorStats:
    monitor = await get_public_monitor(monitor_id, db)

    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found monitor"
        )

    stats = await compute_monitor_stats(
        db,
        monitor_id,
        from_ts=from_ts,
        to_ts=to_ts
    )

    return stats


@router.get(
    "/monitors/{monitor_id}/checks-history",
    response_model=list[CheckResultRead]
)
async def get_public_checks_result_endpoint(
    monitor_id: uuid.UUID,
    from_ts: datetime = Query(None, description="Start of checks(UTC)"),
    to_ts: datetime = Query(None, description="End of checks(UTC)"),
    db: AsyncSession = Depends(get_async_db)
) -> list[CheckResultRead]:
    monitor = await get_public_monitor(monitor_id, db)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found monitor"
        )

    return (await get_checks_in_period(db, monitor_id, from_ts, to_ts))











