import time
import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio.session import AsyncSession

from app.core.deps import get_current_user
from app.crud.check_result import (
    create_check_result,
    get_checks_in_period,
    get_recent_results_for_monitor,
)
from app.crud.monitor import (
    create_monitor,
    get_monitor,
    get_monitors_for_owner_by_ids,
    get_monitors_for_project,
    set_monitors_status_by_ids,
    update_monitor,
)
from app.crud.project import get_project
from app.db.session import get_async_db
from app.models.user import User as UserModel
from app.schemas.check_result import CheckResultRead
from app.schemas.monitor import (
    MonitorCreate,
    MonitorEdit,
    MonitorIdList,
    MonitorRead,
    MonitorStats,
)
from app.services.monitoring import check_monitor_once
from app.services.stats import compute_monitor_stats

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post(
    "/projects/{project_id}",
    response_model=MonitorRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_monitor_for_project_endpoint(
    project_id: uuid.UUID,
    monitor_in: MonitorCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> MonitorRead:

    project = await get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions for this project",
        )

    return await create_monitor(db, project, monitor_in)


@router.get("/projects/{project_id}", response_model=list[MonitorRead])
async def get_monitors_for_project_endpoint(
    project_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[MonitorRead]:

    project = await get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions for this project",
        )

    return list(await get_monitors_for_project(db, project_id, skip, limit))


@router.get("/{monitor_id}", response_model=MonitorRead)
async def get_monitor_by_id_endpoint(
    monitor_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> MonitorRead:
    monitor = await get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    project = await get_project(db, monitor.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    return monitor


@router.post(
    "/{monitor_id}/check",
    response_model=CheckResultRead,
    status_code=status.HTTP_201_CREATED,
)
async def check_monitor_now_endpoint(
    monitor_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> CheckResultRead:
    monitor = await get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    project = await get_project(db, monitor.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    return await check_monitor_once(db, monitor)


@router.get("/{monitor_id}/checks", response_model=list[CheckResultRead])
async def get_recent_checks_for_monitor_endpoint(
    monitor_id: uuid.UUID,
    limit: int = 20,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[CheckResultRead]:
    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be between 1 and 200",
        )

    monitor = await get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    project = await get_project(db, monitor.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    return list(await get_recent_results_for_monitor(db, monitor.id, limit))


@router.get("/{monitor_id}/stats", response_model=MonitorStats)
async def get_monitor_stats_endpoint(
    monitor_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
    from_ts: datetime | None = Query(None, description="Start of interval (UTC)"),
    to_ts: datetime | None = Query(None, description="Start of interval (UTC)"),
) -> MonitorStats:
    """
    Stats of monitor in period.
    if from_ts / to_ts is None - period = last 24 hours
    """

    monitor = await get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    project = await get_project(db, monitor.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    stats = await compute_monitor_stats(
        db,
        monitor_id,
        from_ts=from_ts,
        to_ts=to_ts,
    )

    return stats


@router.get("/{monitor_id}/checks-history", response_model=list[CheckResultRead])
async def get_checks_history_endpoint(
    monitor_id: uuid.UUID,
    from_ts: datetime,
    to_ts: datetime,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[CheckResultRead]:
    monitor = await get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    project = await get_project(db, monitor.project_id)
    if not project and current_user != project.owner_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    return list(await get_checks_in_period(db, monitor_id, from_ts, to_ts))


@router.put("/bulk-set-status", response_model=int)
async def bulk_deactivate_monitors_endpoint(
    monitors: MonitorIdList,
    is_active: bool,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> int:
    monitors_ids = monitors.ids
    if not monitors_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monitor list cannot be empty",
        )

    monitors_to_set_status = await get_monitors_for_owner_by_ids(
        db, monitors_ids, current_user.id
    )

    if len(monitors_to_set_status) != len(monitors_ids):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can deactivate monitors",
        )

    checked_ids_to_off = [monitor.id for monitor in monitors_to_set_status]

    return await set_monitors_status_by_ids(db, checked_ids_to_off, is_active)


@router.patch("/{monitor_id}", response_model=MonitorRead)
async def update_monitor_endpoint(
    monitor_id: uuid.UUID,
    monitor_in: MonitorEdit,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> MonitorRead:
    monitor_db = await get_monitor(db, monitor_id)

    if not monitor_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    project_db = await get_project(db, monitor_db.project_id)

    if not project_db or project_db.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found"
        )

    return await update_monitor(db, monitor_db, monitor_in)
