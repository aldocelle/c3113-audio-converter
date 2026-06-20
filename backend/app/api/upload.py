from fastapi import APIRouter, UploadFile, File, Request, status
from typing import List
from app.config import settings, get_logger
from app.core.validation import validate_extension, validate_audio_magic, sanitize_filename
from app.core.rate_limit import upload_limiter
from app.core.errors import create_http_exception, ErrorCode
from app.models.upload import UploadResponse, UploadedFile
from app.services.storage import save_upload

router = APIRouter()
logger = get_logger(__name__)

MAX_FILES = 20
MAX_FILE_BYTES = settings.max_file_size_mb * 1024 * 1024
MAGIC_PEEK = 64


@router.post("/upload", response_model=UploadResponse)
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    request_id = getattr(request.state, "request_id", "unknown")
    client_ip = request.client.host if request.client else "unknown"

    if not upload_limiter.is_allowed(client_ip):
        raise create_http_exception(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            "Rate limit exceeded. Maximum 30 requests per minute.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"client_ip": client_ip, "limit": "30/min"},
            request_id=request_id,
        )

    if not files:
        raise create_http_exception(
            ErrorCode.INVALID_INPUT,
            "No files provided",
            status_code=status.HTTP_400_BAD_REQUEST,
            request_id=request_id,
        )

    if len(files) > MAX_FILES:
        raise create_http_exception(
            ErrorCode.INVALID_INPUT,
            f"Too many files: maximum {MAX_FILES} per request",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"max": MAX_FILES, "provided": len(files)},
            request_id=request_id,
        )

    accepted: List[UploadedFile] = []
    rejected: List[dict] = []

    for upload in files:
        safe_name = sanitize_filename(upload.filename or "unknown")

        ext_ok, ext = validate_extension(safe_name)
        if not ext_ok:
            reason = f"Unsupported extension: {ext}"
            rejected.append({"name": safe_name, "reason": reason})
            logger.info(f"Upload rejected: {safe_name} - {reason}", extra={"request_id": request_id})
            continue

        data = await upload.read()

        if len(data) == 0:
            reason = "File is empty"
            rejected.append({"name": safe_name, "reason": reason})
            logger.info(f"Upload rejected: {safe_name} - {reason}", extra={"request_id": request_id})
            continue

        if len(data) > MAX_FILE_BYTES:
            reason = f"Exceeds {settings.max_file_size_mb} MB limit"
            rejected.append({"name": safe_name, "reason": reason})
            logger.warning(f"Upload rejected: {safe_name} - {reason} ({len(data)} bytes)", extra={"request_id": request_id})
            continue

        magic_ok, detected_fmt = validate_audio_magic(data[:MAGIC_PEEK])
        if not magic_ok:
            reason = "Invalid audio format"
            rejected.append({"name": safe_name, "reason": reason})
            logger.info(f"Upload rejected: {safe_name} - {reason}", extra={"request_id": request_id})
            continue

        try:
            file_id, stored_path = await save_upload(data, safe_name, ext)
            accepted.append(UploadedFile(
                file_id=file_id,
                original_name=safe_name,
                size_bytes=len(data),
                mime_type=f"audio/{detected_fmt}",
                stored_path=stored_path,
            ))
            logger.info(
                f"Upload accepted: {safe_name}",
                extra={
                    "request_id": request_id,
                    "file_id": file_id,
                    "size_bytes": len(data),
                    "format": detected_fmt,
                }
            )
        except Exception as e:
            reason = "Failed to save file"
            rejected.append({"name": safe_name, "reason": reason})
            logger.error(
                f"Upload storage failed: {safe_name}",
                extra={"request_id": request_id, "error": str(e)},
                exc_info=True
            )

    logger.info(
        "Upload batch processed",
        extra={
            "request_id": request_id,
            "client_ip": client_ip,
            "accepted": len(accepted),
            "rejected": len(rejected),
        }
    )

    return UploadResponse(
        uploaded=accepted,
        rejected=rejected,
        total_accepted=len(accepted),
        total_rejected=len(rejected),
    )
