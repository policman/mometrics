import uuid
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.crud.monitor import get_monitor
from app.models import Monitor
from app.services.monitoring import check_monitor_once


@celery_app.task
def run_monitor_check(monitor_id: str) -> None:
    """
    Celery-task: check monitor and save
    """
    monitor_uuid = uuid.UUID(monitor_id)

    with SessionLocal() as db:
        monitor = get_monitor(db, monitor_uuid)
        if not monitor:
            # logi
            return

        check_monitor_once(db, monitor)


@celery_app.task
def run_all_monitors():
    with SessionLocal() as db:
        monitors = (db.scalars(
            select(Monitor)
            .where(Monitor.is_active.is_(True))
        )).all()

        for monitor in monitors:
            run_monitor_check(str(monitor.id))
