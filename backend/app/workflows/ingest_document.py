import asyncio
import datetime
import uuid
from pathlib import Path
from typing import Any

import inngest

from app.schemas.document import DocumentChunks, IngestionResult
from app.services.embeddings import embed_texts
from app.services.pdf_processing import load_and_chunk_pdf
from app.services.vector_store import vector_store
from app.workflows.client import DOCUMENT_UPLOADED_EVENT, inngest_client


@inngest_client.create_function(
    fn_id="ingest-document",
    name="Ingest document",
    trigger=inngest.TriggerEvent(event=DOCUMENT_UPLOADED_EVENT),
    throttle=inngest.Throttle(limit=2, period=datetime.timedelta(minutes=1)),
    rate_limit=inngest.RateLimit(
        limit=1,
        period=datetime.timedelta(hours=4),
        key="event.data.source_id",
    ),
)
async def ingest_document(ctx: inngest.Context) -> dict[str, Any]:
    pdf_path = Path(str(ctx.event.data["pdf_path"]))
    source_id = str(ctx.event.data["source_id"])

    document = await ctx.step.run(
        "load-and-chunk", _load_and_chunk, pdf_path, source_id, output_type=DocumentChunks
    )
    result = await ctx.step.run(
        "embed-and-store", _embed_and_store, document, output_type=IngestionResult
    )
    return result.model_dump()


async def _load_and_chunk(pdf_path: Path, source_id: str) -> DocumentChunks:
    try:
        chunks = await asyncio.to_thread(load_and_chunk_pdf, pdf_path)
    except Exception as exc:
        raise inngest.NonRetriableError(f"Could not read '{source_id}': {exc}") from exc
    return DocumentChunks(source_id=source_id, chunks=chunks)


async def _embed_and_store(document: DocumentChunks) -> IngestionResult:
    if not document.chunks:
        return IngestionResult(ingested_chunks=0)

    vectors = await embed_texts(document.chunks)
    # Deterministic IDs so re-ingesting a document updates its chunks instead of duplicating them
    ids = [
        str(uuid.uuid5(uuid.NAMESPACE_URL, f"{document.source_id}:{index}"))
        for index in range(len(document.chunks))
    ]
    payloads = [{"source": document.source_id, "text": chunk} for chunk in document.chunks]
    await vector_store.upsert(ids, vectors, payloads)
    return IngestionResult(ingested_chunks=len(document.chunks))
