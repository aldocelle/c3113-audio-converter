from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from typing import List, Optional
from app.models.job import ConversionParams


class BatchStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    PARTIAL_FAILURE = "partial_failure"
    FAILED = "failed"


class BatchJobInfo(BaseModel):
    job_id: str
    file_id: str
    status: str


class BatchRequest(BaseModel):
    file_ids: List[str]
    params: ConversionParams


class BatchResponse(BaseModel):
    batch_id: str
    status: BatchStatus
    total_files: int
    completed_count: int
    failed_count: int
    jobs: List[BatchJobInfo]
    created_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
