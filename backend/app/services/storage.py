import uuid
import aiofiles
from pathlib import Path
from app.config import settings, get_logger

logger = get_logger(__name__)


def ensure_dirs() -> None:
    Path(settings.temp_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


async def save_upload(data: bytes, original_name: str, extension: str) -> tuple[str, str]:
    """
    Write file to upload dir under a UUID-keyed path.
    Returns (file_id, absolute_path).
    """
    ensure_dirs()
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{extension}"
    dest = Path(settings.upload_dir) / filename
    async with aiofiles.open(dest, "wb") as f:
        await f.write(data)
    logger.info(f"Saved upload: {file_id} ({len(data)} bytes)")
    return file_id, str(dest.resolve())


def delete_file(path: str) -> None:
    try:
        Path(path).unlink(missing_ok=True)
    except Exception as e:
        logger.warning(f"Could not delete {path}: {e}")
