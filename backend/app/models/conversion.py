from pydantic import BaseModel, Field


class ConversionRequest(BaseModel):
    file_id: str = Field(..., description="UUID of uploaded file")
    format: str = Field(..., description="Target format: mp3, wav, flac, ogg, m4a")
    bitrate: str = Field(default="192k", description="Audio bitrate")
    sample_rate: str = Field(default="44100", description="Sample rate in Hz")
    channels: str = Field(default="2", description="1=mono, 2=stereo")


class ConversionResponse(BaseModel):
    success: bool
    file_id: str | None = None
    output_format: str | None = None
    output_size_bytes: int | None = None
    error: str | None = None
