from fastapi import APIRouter, HTTPException
import uuid
from pathlib import Path
from app.config import settings, get_logger
from app.models.job import JobRequest, JobResponse, JobStatus
from app.services.job_store import create_job, get_job
from app.workers.tasks import convert_audio_task

router = APIRouter()
logger = get_logger(__name__)


@router.post("/jobs", response_model=JobResponse)
async def queue_conversion(req: JobRequest):
    """Queue a conversion job and return job ID."""
    # Validate input file exists
    input_path = Path(settings.upload_dir) / f"{req.file_id}.*"
    matches = list(input_path.parent.glob(input_path.name))
    if not matches:
        raise HTTPException(status_code=404, detail=f"File {req.file_id} not found")

    # Create job record
    job_id = str(uuid.uuid4())
    job = create_job(job_id, req.file_id, req.params)

    # Queue Celery task
    task = convert_audio_task.delay(
        job_id=job_id,
        file_id=req.file_id,
        format=req.params.format,
        bitrate=req.params.bitrate,
        sample_rate=req.params.sample_rate,
        channels=req.params.channels,
    )

    logger.info(f"Job {job_id} queued (Celery task: {task.id})")
    return job


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """Get job status by ID."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job
