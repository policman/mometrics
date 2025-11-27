import uuid
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.crud.monitor import get_monitor
from app.models import Monitor, CheckResult
from app.services.monitoring import check_monitor_once
from datetime import datetime as dt, UTC
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@celery_app.task
def run_monitor_check(monitor_id: str) -> None:
    """
    Celery-task: check monitor and save
    """
    logger.info("Celery: run_monitor_check monitor_id=%s", monitor_id)
    monitor_uuid = uuid.UUID(monitor_id)

    with SessionLocal() as db:
        monitor = get_monitor(db, monitor_uuid)
        if not monitor:
            logger.warning("Celery: monitor not found id=%s", monitor_id)
            return

        check_monitor_once(db, monitor)


@celery_app.task
def schedule_due_monitors() -> None:
    """
    dispatcher: find all monitors, which need to check,
    and give them tasks run_monitor_check
    """
    logger.info("Celery: schedule_due_monitors started")

    with SessionLocal() as db:
        now = dt.now(UTC)

        monitors = db.scalars(
            select(Monitor).where(Monitor.is_active.is_(True))
        ).all()

        for monitor in monitors:
            last_result = db.scalars(
                select(CheckResult)
                .where(CheckResult.monitor_id == monitor.id)
                .order_by(CheckResult.checked_at.desc())
                .limit(1)
            ).first()

            if last_result is None:
                due = True
            else:
                elapsed_sec = (now - last_result.checked_at).total_seconds()
                due = elapsed_sec >= monitor.check_interval_sec

            if due:
                logger.info(
                    "Celery: scheduling monitor check id=%s url=%s",
                    monitor.id,
                    monitor.target_url,
                )
                run_monitor_check(str(monitor.id))
