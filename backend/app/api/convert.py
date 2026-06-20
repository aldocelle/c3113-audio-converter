from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import tempfile
from app.config import settings, get_logger
from app.models.conversion import ConversionRequest, ConversionResponse
from app.core.ffmpeg import convert_audio
from app.services.storage import delete_file

router = APIRouter()
logger = get_logger(__name__)


@router.post("/convert", response_model=ConversionResponse)
async def convert_file(req: ConversionRequest):
    """Convert a previously uploaded file and return metadata."""
    # Validate file_id exists in uploads dir
    input_path = Path(settings.upload_dir) / f"{req.file_id}.*"
    matches = list(input_path.parent.glob(input_path.name))

    if not matches:
        raise HTTPException(status_code=404, detail=f"File {req.file_id} not found")

    input_file = str(matches[0])
    output_ext = f".{req.format}"
    output_file = str(Path(settings.temp_dir) / f"{req.file_id}_output{output_ext}")

    try:
        convert_audio(
            input_file,
            output_file,
            req.format,
            req.bitrate,
            req.sample_rate,
            req.channels,
        )

        output_size = Path(output_file).stat().st_size

        logger.info(f"Conversion complete: {req.file_id} → {req.format} ({output_size} bytes)")

        return ConversionResponse(
            success=True,
            file_id=req.file_id,
            output_format=req.format,
            output_size_bytes=output_size,
        )

    except Exception as e:
        logger.error(f"Conversion failed for {req.file_id}: {e}")
        # Cleanup partial output
        if Path(output_file).exists():
            delete_file(output_file)
        return ConversionResponse(
            success=False,
            error=str(e),
        )


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """Download a converted file by file_id (looks in temp dir first, then uploads)."""
    # Try temp dir first (converted files)
    temp_path = Path(settings.temp_dir) / f"{file_id}_output.*"
    matches = list(temp_path.parent.glob(temp_path.name))

    if matches:
        file_path = matches[0]
        return FileResponse(
            path=file_path,
            filename=f"{file_id}{file_path.suffix}",
            media_type="audio/*",
        )

    # Fall back to uploads (original files)
    upload_path = Path(settings.upload_dir) / f"{file_id}.*"
    matches = list(upload_path.parent.glob(upload_path.name))

    if matches:
        file_path = matches[0]
        return FileResponse(
            path=file_path,
            filename=f"download{file_path.suffix}",
            media_type="audio/*",
        )

    raise HTTPException(status_code=404, detail=f"File {file_id} not found")
