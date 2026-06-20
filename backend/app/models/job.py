from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from typing import Optional


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ConversionParams(BaseModel):
    format: str
    bitrate: str = "192k"
    sample_rate: str = "44100"
    channels: str = "2"


class JobRequest(BaseModel):
    file_id: str
    params: ConversionParams


class JobResponse(BaseModel):
    job_id: str
    file_id: str
    status: JobStatus
    params: ConversionParams
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    output_file_id: Optional[str] = None
    output_size_bytes: Optional[int] = None
    error: Optional[str] = None
