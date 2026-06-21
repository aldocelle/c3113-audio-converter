import os
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings, get_logger
from app.core.errors import ErrorCode, ErrorResponse
from app.api.upload import router as upload_router
from app.api.convert import router as convert_router
from app.api.jobs import router as jobs_router
from app.api.batch import router as batch_router
from app.api.progress import router as progress_router

logger = get_logger(__name__)


async def request_logging_middleware(request: Request, call_next):
    """Log all requests with timing and status."""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "client_ip": request.client.host if request.client else "unknown",
        }
    )

    response.headers["X-Request-ID"] = request_id
    return response


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.app_debug,
        version="0.2.0",
    )

    # Allowed origins: localhost for dev + any extra from CORS_ORIGINS env
    # (comma-separated). The regex additionally permits all *.vercel.app
    # deployments so preview/production URLs work without redeploying.
    default_origins = ["http://localhost:5173", "http://localhost:3000"]
    extra = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
    app.add_middleware(CORSMiddleware,
        allow_origins=default_origins + extra,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.middleware("http")(request_logging_middleware)

    app.include_router(upload_router, tags=["upload"])
    app.include_router(convert_router, tags=["convert"])
    app.include_router(jobs_router, tags=["jobs"])
    app.include_router(batch_router, tags=["batch"])
    app.include_router(progress_router, tags=["progress"])

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Catch-all error handler for unhandled exceptions."""
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(
            f"Unhandled exception: {str(exc)}",
            extra={"request_id": request_id, "exception": str(exc)},
            exc_info=True
        )
        error_response = ErrorResponse(
            error_code=ErrorCode.INTERNAL_ERROR,
            message="An internal error occurred",
            request_id=request_id,
        )
        return JSONResponse(
            status_code=500,
            content=error_response.dict(exclude_none=True),
        )

    @app.get("/health")
    async def health_check():
        return {
            "status": "ok",
            "app": settings.app_name,
            "environment": settings.app_env,
            "version": "0.2.0",
        }

    @app.get("/ready")
    async def readiness_check():
        return {"ready": True, "timestamp": time.time()}

    logger.info(f"Application '{settings.app_name}' initialized in {settings.app_env} mode")
    return app
