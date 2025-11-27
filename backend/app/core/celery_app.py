from celery import Celery

from app.core.config import get_settings
from app.core.logging import setup_logging

setup_logging()

settings = get_settings()

celery_app = Celery(
    "mometrics",
    broker=str(settings.redis_url),
    backend=str(settings.redis_url),
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

celery_app.autodiscover_tasks(["app.tasks"])

celery_app.conf.beat_schedule = {
    "schedule-due-monitors-every-30s": {
        "task": "app.tasks.monitors.schedule_due_monitors",
        "schedule": 30.0,
    }
}

