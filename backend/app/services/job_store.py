import json
from datetime import datetime
from pathlib import Path
from app.config import settings, get_logger
from app.models.job import JobStatus, JobResponse, ConversionParams

logger = get_logger(__name__)

JOBS_DIR = Path(settings.temp_dir) / "jobs"


def ensure_jobs_dir() -> None:
    JOBS_DIR.mkdir(parents=True, exist_ok=True)


def job_file_path(job_id: str) -> Path:
    return JOBS_DIR / f"{job_id}.json"


def create_job(
    job_id: str,
    file_id: str,
    params: ConversionParams,
) -> JobResponse:
    """Write job metadata to disk."""
    ensure_jobs_dir()
    job = JobResponse(
        job_id=job_id,
        file_id=file_id,
        status=JobStatus.PENDING,
        params=params,
        created_at=datetime.utcnow(),
    )
    with open(job_file_path(job_id), "w") as f:
        f.write(job.model_dump_json())
    logger.info(f"Job created: {job_id}")
    return job


def get_job(job_id: str) -> JobResponse | None:
    """Load job metadata from disk."""
    path = job_file_path(job_id)
    if not path.exists():
        return None
    with open(path) as f:
        data = json.load(f)
    return JobResponse(**data)


def update_job(
    job_id: str,
    status: JobStatus,
    started_at: datetime | None = None,
    completed_at: datetime | None = None,
    output_file_id: str | None = None,
    output_size_bytes: int | None = None,
    error: str | None = None,
) -> JobResponse:
    """Update job status and metadata."""
    job = get_job(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")

    job.status = status
    if started_at:
        job.started_at = started_at
    if completed_at:
        job.completed_at = completed_at
    if output_file_id:
        job.output_file_id = output_file_id
    if output_size_bytes is not None:
        job.output_size_bytes = output_size_bytes
    if error:
        job.error = error

    with open(job_file_path(job_id), "w") as f:
        f.write(job.model_dump_json())

    logger.info(f"Job updated: {job_id} -> {status}")
    return job
