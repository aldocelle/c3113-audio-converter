"""
Celery worker entrypoint.
Run with: celery -A worker.app worker --loglevel=info
"""
from app.core.celery_app import celery_app
from app.workers.tasks import convert_audio_task  # noqa: F401 - import to register

app = celery_app
