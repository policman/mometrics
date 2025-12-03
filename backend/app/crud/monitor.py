import uuid
from typing import Sequence, cast
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from sqlalchemy.engine import CursorResult
from app.models.monitor import Monitor as MonitorModel
from app.models.project import Project as ProjectModel
from app.schemas.monitor import MonitorCreate, MonitorIdList


def create_monitor(
        db: Session,
        project: ProjectModel,
        monitor_in: MonitorCreate,
) -> MonitorModel:
    monitor = MonitorModel(
        project_id = project.id,
        name=monitor_in.name,
        target_url=str(monitor_in.target_url),
        check_interval_sec=monitor_in.check_interval_sec,
        is_active=monitor_in.is_active
    )
    db.add(monitor)
    db.commit()
    db.refresh(monitor)
    return monitor


def get_monitor(
        db: Session,
        monitor_id: uuid.UUID,
) -> MonitorModel | None:
    return (
        db.scalar(
            select(MonitorModel)
            .where(MonitorModel.id == monitor_id)
        )
    )


def get_monitors_for_project(
        db: Session,
        project_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
) -> Sequence[MonitorModel]:
    return (
        db.scalars(
            select(MonitorModel)
            .where(MonitorModel.project_id == project_id)
            .offset(skip)
            .limit(limit)
        ).all()
    )

def get_monitors_for_owner_by_ids(
        db: Session,
        monitor_ids: list[uuid.UUID],
        user_id: uuid.UUID
):
    result = db.scalars(
        select(MonitorModel)
        .join(ProjectModel, MonitorModel.project_id == ProjectModel.id)
        .where(
            MonitorModel.id.in_(monitor_ids),
            ProjectModel.owner_id == user_id
        )
    ).all()
    return result

def set_monitors_status_by_ids(
        db: Session,
        monitor_ids: list[uuid.UUID],
        is_active: bool
):
    result = db.execute(
        update(MonitorModel)
        .where(
            MonitorModel.id.in_(monitor_ids),
            MonitorModel.is_active.is_(not is_active)
        )
        .values(
            is_active=is_active,
            updated_at=datetime.now(timezone.utc)
        )
    )
    rows_affected = cast(CursorResult, result).rowcount

    if is_active:
        _ = db.execute(
            update(ProjectModel)
            .where(
                ProjectModel.id == MonitorModel.project_id,
                ProjectModel.is_active.is_(False)
            )
            .values(is_active=True)
        )

    db.commit()
    return rows_affected
