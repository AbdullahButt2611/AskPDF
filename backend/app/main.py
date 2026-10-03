import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import inngest.fast_api
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.api.routes import documents, queries
from app.core.exceptions import AppError
from app.services.document_registry import document_registry
from app.services.documents import register_untracked_uploads, remove_orphaned_chunks
from app.services.vector_store import vector_store
from app.workflows.answer_question import answer_question
from app.workflows.client import inngest_client
from app.workflows.ingest_document import ingest_document

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await document_registry.initialize()
    try:
        await vector_store.ensure_collection()
        await register_untracked_uploads()
        await remove_orphaned_chunks()
    except Exception as exc:
        raise RuntimeError("Could not connect to Qdrant. Make sure it is running before starting the API.") from exc
    yield


app = FastAPI(title="RAG AI Agent API", lifespan=lifespan)
app.include_router(documents.router, prefix="/api")
app.include_router(queries.router, prefix="/api")

inngest.fast_api.serve(app, inngest_client, [ingest_document, answer_question])


@app.exception_handler(AppError)
async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Something went wrong on our side. Please try again."},
    )
