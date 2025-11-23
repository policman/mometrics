import uuid
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.crud.project import get_project
from app.db.session import get_db
from app.schemas.monitor import MonitorRead, MonitorCreate
from app.models.user import User as UserModel
from app.crud.monitor import get_monitor, get_monitors_for_project, create_monitor

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












