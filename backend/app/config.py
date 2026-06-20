import logging
import json
import sys
import os
from datetime import datetime
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "C3113 Audio Converter"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    max_file_size_mb: int = 500
    temp_dir: str = "./temp"
    upload_dir: str = "./uploads"

    ffmpeg_path: str = "ffmpeg"
    ffmpeg_timeout_seconds: int = 300

    log_level: str = "INFO"
    log_format: str = "json"

    class Config:
        env_file = ".env" if os.path.exists(".env") else None
        case_sensitive = False


settings = Settings()


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        if settings.log_format == "json":
            log_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
            }
            if record.exc_info:
                log_data["exception"] = self.formatException(record.exc_info)
            return json.dumps(log_data)
        else:
            ts = datetime.fromtimestamp(record.created).isoformat()
            return f"{ts} - {record.name} - {record.levelname} - {record.getMessage()}"


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    handler = logging.StreamHandler(sys.stdout)
    formatter = StructuredFormatter()
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(settings.log_level)
    return logger
