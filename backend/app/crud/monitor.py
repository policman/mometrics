import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.monitor import Monitor as MonitorModel
from app.models.project import Project as ProjectModel
from app.schemas.monitor import MonitorCreate


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
            .where(
                MonitorModel.id == monitor_id,
                MonitorModel.is_active.is_(True)
            )
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
            .where(
                MonitorModel.project_id == project_id,
                MonitorModel.is_active.is_(True)
            )
            .offset(skip)
            .limit(limit)
        ).all()
    )