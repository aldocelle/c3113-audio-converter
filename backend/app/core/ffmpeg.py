import subprocess
import os
from pathlib import Path
from app.config import settings, get_logger

logger = get_logger(__name__)

SUPPORTED_FORMATS = {"mp3", "wav", "flac", "ogg", "m4a"}
CODEC_MAP = {
    "mp3": "libmp3lame",
    "wav": "pcm_s16le",
    "flac": "flac",
    "ogg": "libvorbis",
    "m4a": "aac",
}
CONTAINER_MAP = {
    "mp3": "mp3",
    "wav": "wav",
    "flac": "flac",
    "ogg": "ogg",
    "m4a": "ipod",
}


def build_ffmpeg_cmd(
    input_path: str,
    output_path: str,
    format: str,
    bitrate: str,
    sample_rate: str,
    channels: str,
) -> list[str]:
    """Build FFmpeg command with validated parameters."""
    if format not in SUPPORTED_FORMATS:
        raise ValueError(f"Format '{format}' not supported")

    # Parse numeric parameters
    try:
        br_num = int(bitrate.rstrip("k"))
        sr_num = int(sample_rate)
        ch_num = int(channels)
    except ValueError as e:
        raise ValueError(f"Invalid parameters: {e}")

    if not (16 <= br_num <= 320):
        raise ValueError(f"Bitrate out of range: {br_num}k (16–320k)")
    if sr_num not in {8000, 16000, 22050, 44100, 48000, 96000}:
        raise ValueError(f"Sample rate not supported: {sr_num}")
    if ch_num not in {1, 2}:
        raise ValueError(f"Channels must be 1 or 2, got {ch_num}")

    codec = CODEC_MAP[format]
    container = CONTAINER_MAP[format]

    cmd = [
        settings.ffmpeg_path,
        "-i", input_path,
        "-c:a", codec,
        "-b:a", bitrate,
        "-ar", sample_rate,
        "-ac", channels,
        "-y",  # overwrite output
        f"-f", container,
        output_path,
    ]

    return cmd


def convert_audio(
    input_path: str,
    output_path: str,
    format: str,
    bitrate: str,
    sample_rate: str,
    channels: str,
    job_id: str = None,
) -> dict:
    """
    Run FFmpeg synchronously to convert audio.
    Returns metadata dict on success. Raises on error or timeout.
    """
    if not Path(input_path).exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    cmd = build_ffmpeg_cmd(input_path, output_path, format, bitrate, sample_rate, channels)

    logger.info(
        "Starting audio conversion",
        extra={
            "job_id": job_id,
            "input": input_path,
            "output_format": format,
            "bitrate": bitrate,
            "sample_rate": sample_rate,
            "channels": channels,
        }
    )

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=settings.ffmpeg_timeout_seconds,
        )

        if result.returncode != 0:
            stderr = result.stderr[:500]
            logger.error(
                f"FFmpeg process failed",
                extra={
                    "job_id": job_id,
                    "return_code": result.returncode,
                    "stderr": stderr,
                }
            )
            raise RuntimeError(f"FFmpeg error: {stderr}")

        if not Path(output_path).exists():
            logger.error(
                f"Output file not created",
                extra={"job_id": job_id, "expected_path": output_path}
            )
            raise RuntimeError("Conversion succeeded but output file not created")

        output_size = Path(output_path).stat().st_size
        logger.info(
            "Audio conversion succeeded",
            extra={
                "job_id": job_id,
                "output_path": output_path,
                "output_size": output_size,
            }
        )

        return {"output_path": output_path, "output_size": output_size}

    except subprocess.TimeoutExpired:
        logger.error(
            f"FFmpeg process timeout",
            extra={
                "job_id": job_id,
                "timeout_seconds": settings.ffmpeg_timeout_seconds,
            }
        )
        raise RuntimeError(f"Conversion timeout (>{settings.ffmpeg_timeout_seconds}s)")

    except FileNotFoundError:
        raise

    except Exception as e:
        logger.error(
            f"Conversion failed",
            extra={"job_id": job_id, "error": str(e)},
            exc_info=True
        )
        raise
