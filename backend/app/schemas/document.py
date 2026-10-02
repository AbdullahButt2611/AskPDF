from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    source_id: str
    status: str = "processing"


class DocumentChunks(BaseModel):
    source_id: str
    chunks: list[str]


class IngestionResult(BaseModel):
    ingested_chunks: int
