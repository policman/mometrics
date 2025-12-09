import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession

from app.models.monitor import Monitor as MonitorModel
from app.schemas.public_monitor import PublicMonitorRead


async def get_public_monitors_for_project(
    project_id: uuid.UUID, limit: int, skip: int, db: AsyncSession
) -> Sequence[PublicMonitorRead]:
    return (
        await db.scalars(
            select(MonitorModel)
            .where(
                MonitorModel.project_id == project_id,
                # MonitorModel.is_active.is_(True)
            )
            .limit(limit=limit)
            .offset(offset=skip)
        )
    ).all()


async def get_public_monitor(
    monitor_id: uuid.UUID, db: AsyncSession
) -> PublicMonitorRead:
    return (
        await db.scalars(
            select(MonitorModel).where(
                MonitorModel.id == monitor_id, MonitorModel.is_active.is_(True)
            )
        )
    ).first()
