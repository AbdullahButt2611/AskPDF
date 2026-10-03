import asyncio
import datetime
import uuid
from pathlib import Path
from typing import Any

import inngest
from pydantic import BaseModel

from app.core.config import settings
from app.core.exceptions import GeminiQuotaExceededError
from app.schemas.document import DocumentChunks, IngestionResult
from app.services.document_registry import document_registry
from app.services.embeddings import embed_texts
from app.services.pdf_processing import load_and_chunk_pdf
from app.services.vector_store import vector_store
from app.workflows.client import DOCUMENT_UPLOADED_EVENT, inngest_client

_PROCESSING_FAILED_MESSAGE = (
    "Something went wrong while processing this document. Please try again in a while, "
    "or contact support if the problem continues."
)
_QUOTA_EXCEEDED_MESSAGE = (
    "Something went wrong while processing this document: we've reached our AI usage limit. "
    "Please try again in a while, or contact support if this keeps happening."
)


class _RunError(BaseModel):
    name: str = ""
    message: str = ""


class _UploadEvent(BaseModel):
    data: dict[str, str]


class _FailedIngestion(BaseModel):
    """Payload of the `inngest/function.failed` event that triggers the failure handler."""

    error: _RunError
    event: _UploadEvent


async def _mark_ingestion_failed(ctx: inngest.Context) -> None:
    failure = _FailedIngestion.model_validate(ctx.event.data)
    # Only NonRetriableError messages are written for users; anything else is an internal failure
    message = failure.error.message if failure.error.name == "NonRetriableError" else _PROCESSING_FAILED_MESSAGE
    await document_registry.mark_failed(
        failure.event.data["source_id"], failure.event.data["upload_id"], message
    )


@inngest_client.create_function(
    fn_id="ingest-document",
    name="Ingest document",
    trigger=inngest.TriggerEvent(event=DOCUMENT_UPLOADED_EVENT),
    throttle=inngest.Throttle(limit=2, period=datetime.timedelta(minutes=1)),
    retries=settings.ai_max_retries,
    on_failure=_mark_ingestion_failed,
)
async def ingest_document(ctx: inngest.Context) -> dict[str, Any]:
    pdf_path = Path(str(ctx.event.data["pdf_path"]))
    source_id = str(ctx.event.data["source_id"])
    upload_id = str(ctx.event.data["upload_id"])

    document = await ctx.step.run(
        "load-and-chunk", _load_and_chunk, pdf_path, source_id, upload_id, output_type=DocumentChunks
    )
    result = await ctx.step.run(
        "embed-and-store", _embed_and_store, document, output_type=IngestionResult
    )
    return result.model_dump()


async def _load_and_chunk(pdf_path: Path, source_id: str, upload_id: str) -> DocumentChunks:
    try:
        chunks = await asyncio.to_thread(load_and_chunk_pdf, pdf_path)
    except Exception as exc:
        raise inngest.NonRetriableError(
            "This PDF couldn't be read. It may be corrupted or password-protected."
        ) from exc
    if not chunks:
        raise inngest.NonRetriableError(
            "No readable text was found in this PDF. Scanned documents aren't supported yet."
        )
    return DocumentChunks(source_id=source_id, upload_id=upload_id, chunks=chunks)


async def _embed_and_store(document: DocumentChunks) -> IngestionResult:
    try:
        vectors = await embed_texts(document.chunks)
    except GeminiQuotaExceededError as exc:
        # Retrying can't help until the quota resets, so fail right away with a clear reason
        raise inngest.NonRetriableError(_QUOTA_EXCEEDED_MESSAGE) from exc
    ids = [
        str(uuid.uuid5(uuid.NAMESPACE_URL, f"{document.upload_id}:{index}"))
        for index in range(len(document.chunks))
    ]
    payloads = [
        {"source": document.source_id, "upload_id": document.upload_id, "text": chunk}
        for chunk in document.chunks
    ]
    await vector_store.upsert(ids, vectors, payloads)

    is_current_upload = await document_registry.mark_ready(
        document.source_id, document.upload_id, len(document.chunks)
    )
    if not is_current_upload:
        # The file was replaced or deleted while this ran, so these chunks must not stay searchable
        await vector_store.delete_by_upload(document.upload_id)
    return IngestionResult(ingested_chunks=len(document.chunks))
