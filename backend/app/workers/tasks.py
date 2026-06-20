import uuid
from pathlib import Path
from datetime import datetime
from app.core.celery_app import celery_app
from app.core.ffmpeg import convert_audio
from app.config import settings, get_logger
from app.services.job_store import update_job
from app.services.storage import save_upload, delete_file
from app.models.job import JobStatus, ConversionParams

logger = get_logger(__name__)


@celery_app.task(name="convert_audio_task", bind=True)
def convert_audio_task(
    self,
    job_id: str,
    file_id: str,
    format: str,
    bitrate: str,
    sample_rate: str,
    channels: str,
):
    """Background task: convert audio and track job status."""
    try:
        # Mark as processing
        update_job(
            job_id,
            JobStatus.PROCESSING,
            started_at=datetime.utcnow(),
        )

        # Find input file
        input_path = Path(settings.upload_dir) / f"{file_id}.*"
        matches = list(input_path.parent.glob(input_path.name))
        if not matches:
            raise FileNotFoundError(f"Input file {file_id} not found")

        input_file = str(matches[0])

        # Create output path
        output_ext = f".{format}"
        output_file = str(Path(settings.temp_dir) / f"{job_id}_output{output_ext}")

        # Run conversion
        result = convert_audio(
            input_file,
            output_file,
            format,
            bitrate,
            sample_rate,
            channels,
            job_id=job_id,
        )
        output_size = result["output_size"]

        # Mark complete
        update_job(
            job_id,
            JobStatus.COMPLETED,
            completed_at=datetime.utcnow(),
            output_file_id=job_id,
            output_size_bytes=output_size,
        )

        logger.info(f"Job {job_id} completed: {output_size} bytes")
        return {"job_id": job_id, "output_size": output_size}

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        update_job(
            job_id,
            JobStatus.FAILED,
            completed_at=datetime.utcnow(),
            error=str(e),
        )
        raise
