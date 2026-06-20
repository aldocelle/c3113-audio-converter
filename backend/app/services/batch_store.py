import json
from datetime import datetime
from pathlib import Path
from app.config import settings, get_logger
from app.models.batch import BatchStatus, BatchResponse, BatchJobInfo

logger = get_logger(__name__)

BATCHES_DIR = Path(settings.temp_dir) / "batches"


def ensure_batches_dir() -> None:
    BATCHES_DIR.mkdir(parents=True, exist_ok=True)


def batch_file_path(batch_id: str) -> Path:
    return BATCHES_DIR / f"{batch_id}.json"


def create_batch(
    batch_id: str,
    file_ids: list[str],
    jobs: list[dict],
) -> BatchResponse:
    """Write batch metadata to disk."""
    ensure_batches_dir()
    batch = BatchResponse(
        batch_id=batch_id,
        status=BatchStatus.QUEUED,
        total_files=len(file_ids),
        completed_count=0,
        failed_count=0,
        jobs=[BatchJobInfo(**j) for j in jobs],
        created_at=datetime.utcnow(),
    )
    with open(batch_file_path(batch_id), "w") as f:
        f.write(batch.model_dump_json())
    logger.info(f"Batch created: {batch_id} ({len(file_ids)} files)")
    return batch


def get_batch(batch_id: str) -> BatchResponse | None:
    """Load batch metadata from disk."""
    path = batch_file_path(batch_id)
    if not path.exists():
        return None
    with open(path) as f:
        data = json.load(f)
    # Convert job dicts back to BatchJobInfo objects
    data["jobs"] = [BatchJobInfo(**j) for j in data["jobs"]]
    return BatchResponse(**data)


def update_batch_status(
    batch_id: str,
    status: BatchStatus,
    completed_count: int | None = None,
    failed_count: int | None = None,
    completed_at: datetime | None = None,
) -> BatchResponse:
    """Update batch progress."""
    batch = get_batch(batch_id)
    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    batch.status = status
    if completed_count is not None:
        batch.completed_count = completed_count
    if failed_count is not None:
        batch.failed_count = failed_count
    if completed_at:
        batch.completed_at = completed_at

    with open(batch_file_path(batch_id), "w") as f:
        f.write(batch.model_dump_json())

    logger.info(
        f"Batch {batch_id} updated: {completed_count}/{batch.total_files} complete"
    )
    return batch
