from celery import Celery
from app.core.config import get_settings

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

celery_app.conf.beat_schedule = {
    "run-every-minute": {
        "task": "app.tasks.monitors.run_all_monitors",
        "schedule": 60.0,
    }
}

celery_app.autodiscover_tasks(["app.tasks"])