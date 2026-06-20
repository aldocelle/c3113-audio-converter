from fastapi import APIRouter, HTTPException, Request
from pathlib import Path
import uuid
from datetime import datetime
from app.config import settings, get_logger
from app.models.batch import BatchRequest, BatchResponse, BatchStatus, BatchJobInfo
from app.core.rate_limit import batch_limiter
from app.services.batch_store import create_batch, get_batch, update_batch_status
from app.services.job_store import create_job
from app.workers.tasks import convert_audio_task

router = APIRouter()
logger = get_logger(__name__)


@router.post("/batch", response_model=BatchResponse)
async def create_batch_job(request: Request, req: BatchRequest):
    """Queue multiple files for conversion as a batch."""
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not batch_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in 60 seconds.",
            headers={"Retry-After": "60"},
        )

    if not req.file_ids:
        raise HTTPException(status_code=400, detail="No files provided")

    if len(req.file_ids) > 100:
        raise HTTPException(status_code=400, detail="Max 100 files per batch")

    # Validate all files exist
    missing = []
    for file_id in req.file_ids:
        input_path = Path(settings.upload_dir) / f"{file_id}.*"
        matches = list(input_path.parent.glob(input_path.name))
        if not matches:
            missing.append(file_id)

    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"Files not found: {', '.join(missing[:5])}",
        )

    # Create batch record
    batch_id = str(uuid.uuid4())
    jobs_info = []

    # Queue all conversions
    for file_id in req.file_ids:
        job_id = str(uuid.uuid4())

        # Create job record
        create_job(job_id, file_id, req.params)

        # Queue Celery task
        convert_audio_task.delay(
            job_id=job_id,
            file_id=file_id,
            format=req.params.format,
            bitrate=req.params.bitrate,
            sample_rate=req.params.sample_rate,
            channels=req.params.channels,
        )

        jobs_info.append({
            "job_id": job_id,
            "file_id": file_id,
            "status": "pending",
        })

    # Create batch record
    batch = create_batch(batch_id, req.file_ids, jobs_info)

    logger.info(f"Batch {batch_id} queued: {len(req.file_ids)} files from {client_ip}")
    return batch


@router.get("/batch/{batch_id}", response_model=BatchResponse)
async def get_batch_status(batch_id: str):
    """Get batch status and all job statuses."""
    batch = get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

    # Recalculate progress
    from app.services.job_store import get_job
    completed = 0
    failed = 0
    for job_info in batch.jobs:
        job = get_job(job_info.job_id)
        if job:
            job_info.status = job.status
            if job.status == "completed":
                completed += 1
            elif job.status == "failed":
                failed += 1

    # Determine batch status
    if completed == batch.total_files:
        batch.status = BatchStatus.COMPLETED
        if not batch.completed_at:
            batch.completed_at = datetime.utcnow()
    elif failed > 0:
        batch.status = BatchStatus.PARTIAL_FAILURE
    elif completed > 0:
        batch.status = BatchStatus.PROCESSING
    else:
        batch.status = BatchStatus.QUEUED

    batch.completed_count = completed
    batch.failed_count = failed

    # Persist updated status
    update_batch_status(
        batch_id,
        batch.status,
        completed_count=completed,
        failed_count=failed,
        completed_at=batch.completed_at if batch.status == BatchStatus.COMPLETED else None,
    )

    return batch
