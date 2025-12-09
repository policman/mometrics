import asyncio
import uuid
from datetime import datetime, timezone

from celery.utils.log import get_task_logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool


from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.crud.monitor import get_monitor
from app.models import CheckResult, Monitor
from app.services.monitoring import check_monitor_once

logger = get_task_logger(__name__)

settings = get_settings()

celery_engine = create_async_engine(
    str(settings.database_url),
    poolclass=NullPool,
)

CelerySessionLocal = async_sessionmaker(bind=celery_engine, expire_on_commit=False)


async def _run_monitor_check_logic(monitor_id: str):
    monitor_uuid = uuid.UUID(monitor_id)
    async with CelerySessionLocal() as db:
        monitor = await get_monitor(db, monitor_uuid)
        if not monitor:
            return
        await check_monitor_once(db, monitor)


async def _schedule_due_monitors_logic():
    async with CelerySessionLocal() as db:
        now = datetime.now(timezone.utc)
        monitors = (
            await db.scalars(select(Monitor).where(Monitor.is_active.is_(True)))
        ).all()

        for monitor in monitors:
            last_result = await db.scalar(
                select(CheckResult)
                .where(CheckResult.monitor_id == monitor.id)
                .order_by(CheckResult.checked_at.desc())
                .limit(1)
            )

            due = False
            if last_result is None:
                due = True
            else:
                last_check_time = last_result.checked_at
                if last_check_time.tzinfo is None:
                    last_check_time = last_check_time.replace(tzinfo=timezone.utc)

                elapsed_sec = (now - last_check_time).total_seconds()
                due = elapsed_sec >= monitor.check_interval_sec

            if due:
                run_monitor_check.delay(str(monitor.id))




@celery_app.task
def run_monitor_check(monitor_id: str) -> None:
    asyncio.run(_run_monitor_check_logic(monitor_id))


@celery_app.task
def schedule_due_monitors() -> None:
    asyncio.run(_schedule_due_monitors_logic())

