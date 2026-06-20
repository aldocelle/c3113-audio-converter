from celery import Celery
from app.config import settings

celery_app = Celery(
    "c3113",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=settings.ffmpeg_timeout_seconds + 60,  # task timeout > FFmpeg timeout
)
