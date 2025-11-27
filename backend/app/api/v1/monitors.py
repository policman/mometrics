import uuid

import time

import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.monitor import (
    create_monitor, get_monitor,
    get_monitors_for_project)
from app.crud.project import get_project
from app.db.session import get_db
from app.models.user import User as UserModel
from app.schemas.monitor import MonitorCreate, MonitorRead
from app.schemas.check_result import CheckResultRead
from app.crud.check_result import (
    create_check_result,
    get_recent_results_for_monitor
)
from app.models.monitor import Monitor as MonitorModel
from app.services.monitoring import check_monitor_once


router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post(
    "/projects/{project_id}",
    response_model=MonitorRead,
    status_code=status.HTTP_201_CREATED
)
def create_monitor_for_project_endpoint(
    project_id: uuid.UUID,
    monitor_in: MonitorCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> MonitorRead:

    project = get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions for this project"
        )

    monitor = create_monitor(db, project, monitor_in)
    return monitor


@router.get(
    "/projects/{project_id}",
    response_model=list[MonitorRead]
)
def get_monitors_for_project_endpoint(
    project_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> list[MonitorRead]:

    project = get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions for this project"
        )

    monitors = get_monitors_for_project(db, project_id, skip, limit)
    return list(monitors)


@router.get(
    "/{monitor_id}",
    response_model=MonitorRead
)
def get_monitor_by_id_endpoint(
    monitor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> MonitorRead:
    monitor = get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found"
        )

    project = get_project(db, monitor.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found"
        )

    return monitor


@router.post(
    "/{monitor_id}/check",
    response_model=CheckResultRead,
    status_code=status.HTTP_201_CREATED,
)
def check_monitor_now_endpoint(
    monitor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> CheckResultRead:
    monitor = get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found"
        )

    project = get_project(db, monitor.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found"
        )

    result = check_monitor_once(db, monitor)

    return result


@router.get(
    "/{monitor_id}/checks",
    response_model=list[CheckResultRead]
)
def get_recent_checks_for_monitor_endpoint(
    monitor_id: uuid.UUID,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> list[CheckResultRead]:
    if limit < 1 or limit > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be between 1 and 200"
        )

    monitor = get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found"
        )

    project = get_project(db, monitor.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found"
        )

    results = get_recent_results_for_monitor(db, monitor.id, limit)
    return list(results)































