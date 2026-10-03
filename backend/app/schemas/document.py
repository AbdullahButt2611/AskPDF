from datetime import datetime
from typing import Literal

from pydantic import BaseModel

DocumentStatus = Literal["processing", "ready", "failed"]


class DocumentResponse(BaseModel):
    source_id: str
    size_bytes: int
    status: DocumentStatus
    chunk_count: int
    error: str | None
    uploaded_at: datetime


class DocumentChunks(BaseModel):
    source_id: str
    upload_id: str
    chunks: list[str]


class IngestionResult(BaseModel):
    ingested_chunks: int
