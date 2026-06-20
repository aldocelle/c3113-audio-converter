from fastapi import APIRouter, HTTPException
from app.config import settings, get_logger
from app.models.progress import JobProgress, BatchProgress
from app.services.job_store import get_job
from app.services.batch_store import get_batch

router = APIRouter()
logger = get_logger(__name__)


@router.get("/jobs/{job_id}/progress", response_model=JobProgress)
async def get_job_progress(job_id: str):
    """Get current progress of a single job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return JobProgress(
        job_id=job.job_id,
        status=job.status,
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        output_size_bytes=job.output_size_bytes,
        error=job.error,
    )


@router.get("/batch/{batch_id}/progress", response_model=BatchProgress)
async def get_batch_progress(batch_id: str):
    """Get current progress of a batch with all job statuses."""
    batch = get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

    # Recalculate progress
    completed = 0
    failed = 0
    jobs_progress = []

    for job_info in batch.jobs:
        job = get_job(job_info.job_id)
        if job:
            if job.status == "completed":
                completed += 1
            elif job.status == "failed":
                failed += 1

            jobs_progress.append(JobProgress(
                job_id=job.job_id,
                status=job.status,
                started_at=job.started_at.isoformat() if job.started_at else None,
                completed_at=job.completed_at.isoformat() if job.completed_at else None,
                output_size_bytes=job.output_size_bytes,
                error=job.error,
            ))
        else:
            jobs_progress.append(JobProgress(
                job_id=job_info.job_id,
                status="pending",
            ))

    progress_percent = int((completed / batch.total_files * 100)) if batch.total_files > 0 else 0

    return BatchProgress(
        batch_id=batch.batch_id,
        status=batch.status,
        total_files=batch.total_files,
        completed_count=completed,
        failed_count=failed,
        progress_percent=progress_percent,
        jobs=jobs_progress,
    )
