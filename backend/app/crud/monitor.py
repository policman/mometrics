import uuid
from datetime import datetime, timezone
from typing import Sequence, cast

from sqlalchemy import select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio.session import AsyncSession

from app.models.monitor import Monitor as MonitorModel
from app.models.project import Project as ProjectModel
from app.schemas.monitor import MonitorCreate, MonitorEdit


async def create_monitor(
    db: AsyncSession,
    project: ProjectModel,
    monitor_in: MonitorCreate,
) -> MonitorModel:
    monitor = MonitorModel(
        project_id=project.id,
        name=monitor_in.name,
        target_url=str(monitor_in.target_url),
        check_interval_sec=monitor_in.check_interval_sec,
        is_active=monitor_in.is_active,
    )
    db.add(monitor)
    await db.commit()
    await db.refresh(monitor)
    return monitor


async def get_monitor(
    db: AsyncSession,
    monitor_id: uuid.UUID,
) -> MonitorModel | None:
    return await db.scalar(select(MonitorModel).where(MonitorModel.id == monitor_id))


async def get_monitors_for_project(
    db: AsyncSession,
    project_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Sequence[MonitorModel]:
    return (
        await db.scalars(
            select(MonitorModel)
            .where(MonitorModel.project_id == project_id)
            .offset(skip)
            .limit(limit)
        )
    ).all()


async def get_monitors_for_owner_by_ids(
    db: AsyncSession, monitor_ids: list[uuid.UUID], user_id: uuid.UUID
) -> Sequence[MonitorModel]:
    return (
        await db.scalars(
            select(MonitorModel)
            .join(ProjectModel, MonitorModel.project_id == ProjectModel.id)
            .where(
                MonitorModel.id.in_(monitor_ids),
                ProjectModel.owner_id == user_id,
            )
        )
    ).all()


async def set_monitors_status_by_ids(
    db: AsyncSession, monitor_ids: list[uuid.UUID], is_active: bool
):
    result = await db.execute(
        update(MonitorModel)
        .where(
            MonitorModel.id.in_(monitor_ids),
            MonitorModel.is_active.is_(not is_active),
        )
        .values(is_active=is_active, updated_at=datetime.now(timezone.utc))
    )
    rows_affected = cast(CursorResult, result).rowcount

    if is_active:
        _ = await db.execute(
            update(ProjectModel)
            .where(
                ProjectModel.id == MonitorModel.project_id,
                ProjectModel.is_active.is_(False),
            )
            .values(is_active=True)
        )

    await db.commit()
    return rows_affected


async def update_monitor(
    db: AsyncSession,
    monitor_db: MonitorModel,
    monitor_in: MonitorEdit,
) -> MonitorModel:
    update_data = monitor_in.model_dump(exclude_unset=True)

    if not update_data:
        return monitor_db

    for field, value in update_data.items():
        if field == "target_url" and value is not None:
            value = str(value)

        setattr(monitor_db, field, value)

    monitor_db.updated_at = datetime.now(timezone.utc)

    db.add(monitor_db)
    await db.commit()
    await db.refresh(monitor_db)
    return monitor_db
