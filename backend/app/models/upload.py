from pydantic import BaseModel
from typing import List


class UploadedFile(BaseModel):
    file_id: str
    original_name: str
    size_bytes: int
    mime_type: str
    stored_path: str


class UploadResponse(BaseModel):
    uploaded: List[UploadedFile]
    rejected: List[dict]
    total_accepted: int
    total_rejected: int
