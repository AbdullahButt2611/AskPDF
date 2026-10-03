import asyncio
import logging
import uuid
from collections.abc import Awaitable

from fastapi import UploadFile

from app.core.exceptions import DocumentExistsError, DocumentNotFoundError, ServiceUnavailableError
from app.schemas.document import DocumentResponse
from app.services.document_registry import document_registry
from app.services.document_storage import delete_pdf, list_stored_pdfs, read_validated_pdf, save_pdf
from app.services.vector_store import vector_store
from app.services.workflow_runs import send_event
from app.workflows.client import DOCUMENT_UPLOADED_EVENT

logger = logging.getLogger(__name__)

_NEVER_PROCESSED_MESSAGE = "This file was never processed. Upload it again to make it searchable."
_DISPATCH_FAILED_MESSAGE = "Processing couldn't start. Upload the file again."


async def list_documents() -> list[DocumentResponse]:
    return await document_registry.list()


async def upload_document(upload: UploadFile, overwrite: bool) -> DocumentResponse:
    filename, content = await read_validated_pdf(upload)

    if await document_registry.get(filename):
        if not overwrite:
            raise DocumentExistsError(
                f"'{filename}' already exists. Uploading it again will replace the existing file."
            )
        await _call_vector_store(vector_store.delete_by_source(filename))

    upload_id = uuid.uuid4().hex
    pdf_path = await asyncio.to_thread(save_pdf, filename, content)
    document = await document_registry.register_upload(filename, upload_id, size_bytes=len(content))

    try:
        await send_event(
            DOCUMENT_UPLOADED_EVENT,
            {"pdf_path": str(pdf_path), "source_id": filename, "upload_id": upload_id},
        )
    except ServiceUnavailableError:
        await document_registry.mark_failed(filename, upload_id, _DISPATCH_FAILED_MESSAGE)
        raise
    return document


async def delete_document(source_id: str) -> None:
    if not await document_registry.get(source_id):
        raise DocumentNotFoundError(f"'{source_id}' doesn't exist. It may have already been deleted.")

    # Embeddings go first: if this fails nothing else is touched and the delete can be retried
    await _call_vector_store(vector_store.delete_by_source(source_id))
    remaining_chunks = await vector_store.count_by_source(source_id)
    if remaining_chunks:
        logger.error("%d chunks of %s survived deletion", remaining_chunks, source_id)
        raise ServiceUnavailableError(
            f"'{source_id}' couldn't be fully removed from the search index. Please try deleting it again."
        )
    await asyncio.to_thread(delete_pdf, source_id)
    await document_registry.delete(source_id)


async def register_untracked_uploads() -> None:
    """Adds PDFs that exist on disk but not in the registry, e.g. files uploaded before it existed."""
    for pdf_path in await asyncio.to_thread(list_stored_pdfs):
        source_id = pdf_path.name
        if await document_registry.get(source_id):
            continue

        upload_id = uuid.uuid4().hex
        chunk_count = await vector_store.count_by_source(source_id)
        await document_registry.register_upload(
            source_id,
            upload_id,
            size_bytes=pdf_path.stat().st_size,
            status="ready",
            chunk_count=chunk_count,
        )
        if chunk_count == 0:
            await document_registry.mark_failed(source_id, upload_id, _NEVER_PROCESSED_MESSAGE)


async def remove_orphaned_chunks() -> None:
    """Deletes chunks whose document isn't in the registry. Such chunks are invisible in the Knowledge Base
    and can't be deleted from it, yet they would still be used to answer questions."""
    registered = {document.source_id for document in await document_registry.list()}
    for source_id in await vector_store.list_sources() - registered:
        logger.warning("Removing orphaned chunks of %s", source_id)
        await vector_store.delete_by_source(source_id)


async def _call_vector_store(operation: Awaitable[None]) -> None:
    try:
        await operation
    except Exception as exc:
        logger.exception("Vector store operation failed")
        raise ServiceUnavailableError(
            "The search index is unavailable right now. Please try again in a moment."
        ) from exc
