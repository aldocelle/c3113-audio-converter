from enum import Enum
from typing import Optional, Any, Dict
from fastapi import HTTPException, status
from pydantic import BaseModel
from app.config import get_logger

logger = get_logger(__name__)


class ErrorCode(str, Enum):
    """Standardized error codes for API responses."""
    INVALID_INPUT = "INVALID_INPUT"
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    CONVERSION_FAILED = "CONVERSION_FAILED"
    JOB_NOT_FOUND = "JOB_NOT_FOUND"
    BATCH_NOT_FOUND = "BATCH_NOT_FOUND"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ErrorResponse(BaseModel):
    """Standardized error response structure."""
    error_code: ErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None


def create_http_exception(
    error_code: ErrorCode,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
) -> HTTPException:
    """Create a structured HTTP exception with error code."""
    error_response = ErrorResponse(
        error_code=error_code,
        message=message,
        details=details,
        request_id=request_id,
    )

    log_level = "warning" if status_code < 500 else "error"
    getattr(logger, log_level)(
        f"{error_code.value}: {message}",
        extra={"status_code": status_code, "details": details}
    )

    return HTTPException(
        status_code=status_code,
        detail=error_response.dict(exclude_none=True),
    )


class ValidationError(Exception):
    """File validation error."""
    pass


class ConversionError(Exception):
    """Audio conversion error."""
    pass


class StorageError(Exception):
    """File storage error."""
    pass
