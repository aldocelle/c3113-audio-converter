import re
import unicodedata
from pathlib import Path

# Magic bytes for supported audio formats
AUDIO_MAGIC_BYTES: dict[str, list[bytes]] = {
    "mp3": [b"\xff\xfb", b"\xff\xf3", b"\xff\xf2", b"ID3"],
    "wav": [b"RIFF"],
    "flac": [b"fLaC"],
    "ogg": [b"OggS"],
    "m4a": [b"\x00\x00\x00\x18ftyp", b"\x00\x00\x00\x1cftyp", b"\x00\x00\x00\x20ftyp"],
    "aac": [b"\xff\xf1", b"\xff\xf9"],
}

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"}


def validate_audio_magic(data: bytes) -> tuple[bool, str]:
    """Check magic bytes to confirm the file is actually audio."""
    for fmt, signatures in AUDIO_MAGIC_BYTES.items():
        for sig in signatures:
            if data[:len(sig)] == sig:
                return True, fmt
    # M4A/AAC containers sometimes have ftyp box at byte 4
    if len(data) >= 12 and data[4:8] == b"ftyp":
        return True, "m4a"
    return False, ""


def sanitize_filename(name: str) -> str:
    """
    Return a safe filename:
    - Normalize unicode
    - Strip path components
    - Replace unsafe characters
    - Truncate to 200 chars
    """
    name = unicodedata.normalize("NFKD", name)
    name = Path(name).name  # strips any directory component
    name = re.sub(r"[^\w\s\-.]", "_", name)
    name = re.sub(r"\s+", "_", name)
    name = name.strip("._")
    return name[:200] or "unnamed"


def validate_extension(filename: str) -> tuple[bool, str]:
    """Return (is_valid, extension)."""
    suffix = Path(filename).suffix.lower()
    return suffix in ALLOWED_EXTENSIONS, suffix
