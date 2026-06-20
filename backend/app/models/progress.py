from pydantic import BaseModel
from typing import Optional


class JobProgress(BaseModel):
    job_id: str
    status: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    output_size_bytes: Optional[int] = None
    error: Optional[str] = None


class BatchProgress(BaseModel):
    batch_id: str
    status: str
    total_files: int
    completed_count: int
    failed_count: int
    progress_percent: int
    jobs: list[JobProgress]
