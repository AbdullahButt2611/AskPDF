# CLAUDE.md — backend

FastAPI app (package `app/`) plus the Inngest workflows that ingest PDFs and answer questions. Run every command from `backend/`.

## Setup and commands

- `.env` needs `GEMINI_API_KEY`; the app refuses to start without it. `QDRANT_URL` and `INNGEST_API_BASE_URL` are optional overrides.
- First-time setup: `python -m virtualenv env`, then `.\env\Scripts\python.exe -m pip install -r requirements.txt`.
- **Smart App Control can block SQLAlchemy's compiled DLL** (`_processors_cy`, imported by LlamaIndex), which fails startup with "An Application Control policy has blocked this file". The fix is to reinstall it as pure Python:
  `$env:DISABLE_SQLALCHEMY_CEXT=1; .\env\Scripts\python.exe -m pip install --force-reinstall --no-deps --no-binary SQLAlchemy SQLAlchemy==2.1.1`
- `requirements.txt` is fully pinned and contains exactly the backend's dependency closure. When adding a package, install it and pin it together with any new transitive dependencies.
- Start Qdrant, then the API, then the Inngest dev server, each in its own terminal:
  1. `docker run -d --name qdrantRagDB -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant` (or `docker start qdrantRagDB`). From Git Bash, prefix the command with `MSYS_NO_PATHCONV=1`, otherwise the `-v` path gets rewritten and the container mounts the wrong folder.
  2. `python -m uvicorn app.main:app --reload` (API docs at http://localhost:8000/docs). Startup fails if Qdrant isn't reachable, because the lifespan hook sets up the collection.
  3. `npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery` (dashboard at http://localhost:8288)

## Architecture

`app/main.py` mounts the routers under `/api`, serves the Inngest functions at `/api/inngest`, and registers the exception handlers. The rest of the package is layered as `api/routes` → `services` → `workflows`, with Pydantic models in `schemas/` and settings in `core/config.py` (a frozen `Settings` dataclass). `services/documents.py` coordinates the document lifecycle across the registry, file storage, the vector store and Inngest events.

**Three stores hold document state, and every change must keep them consistent:**
- `uploads/` holds the PDFs.
- Qdrant holds the chunks. Each payload is `{"source": filename, "upload_id": ..., "text": ...}`, with keyword payload indexes on `source` and `upload_id`.
- `documents.db` (SQLite, `services/document_registry.py`) holds status (`processing`, `ready` or `failed`), chunk count, error message and the current `upload_id` for each file.

`source_id` is the bare filename and is the document's key. On startup, `register_untracked_uploads` adds any PDF in `uploads/` that the registry doesn't know about. Then `remove_orphaned_chunks` deletes chunks whose `source` has no registry row, because nothing else could reach them: they'd be invisible in the Knowledge Base and impossible to delete from it, yet still used in answers. It finds them with a Qdrant facet query and ignores `count: 0` values, which the payload index keeps reporting for deleted points.

Qdrant deletes points logically first and compacts files later, and its storage files are fixed-size blocks allocated up front, so `qdrant_storage/` stays hundreds of MB even when empty. Check `points_count` rather than disk size.

**Endpoints:**
- `GET /api/documents` lists the registry, newest first.
- `POST /api/documents?overwrite=false` validates the PDF (extension, `%PDF-` signature, 20 MB limit, filename stripped of directory parts). It returns **409** if the name already exists and `overwrite` is false. With `overwrite=true`, it deletes the old chunks first. It then saves the file, registers a new `upload_id`, sends `rag/document.uploaded`, and returns 202. If sending the event fails, the document is marked `failed`.
- `DELETE /api/documents/{source_id}` deletes the chunks first and confirms none remain (it returns 503 otherwise), then deletes the file, then the registry row. A vector-store failure therefore leaves everything intact, and the delete can be retried. It returns 404 if the document is unknown.
- `POST /api/queries` sends `rag/question.asked`, then polls the Inngest REST API (`/events/{id}/runs`) until the run finishes or `answer_timeout_seconds` passes, and returns the run's output.

**Workflows (`app/workflows/`):**
- `ingest-document`: chunks the PDF in a thread, embeds with Gemini, and upserts with point IDs `uuid5(upload_id:i)`. Then `mark_ready` succeeds only if that `upload_id` is still current. If the file was replaced or deleted mid-run, the workflow deletes its own chunks by `upload_id`, so stale results never stay searchable. Unreadable PDFs and PDFs without text raise `NonRetriableError` with a user-facing message. The `on_failure` handler (`_mark_ingestion_failed`) writes that message, or a generic one, into the registry. The function is throttled to 2 runs per minute.
- `answer-question`: retrieves top-k chunks and returns a fixed answer without calling the LLM when nothing matches. Otherwise it calls `ctx.step.ai.infer` with each model in `settings.answer_models` in turn, catching `inngest.StepError` (raised after `retries=1`) to move to the next model. If every model fails, it returns `AnswerResult.error`, which the route turns into a 503.
- Step IDs (`llm-answer-{model}`) must stay deterministic for Inngest replay.
- The Gemini adapter writes `model` into the request body, so each call gets its own copy (`{**request_body}`).
- A 500 on `/api/inngest` in the uvicorn log is how the SDK reports a step that raised an error. It's expected for failed ingestions.

**Everything on the request path is async** (`httpx`, `AsyncQdrantClient`, and SQLite through `asyncio.to_thread`). The workflows run inside the same uvicorn process as the API, so blocking calls would stall `/api/queries` while it polls.

**Errors:** raise `AppError` subclasses from `core/exceptions.py`. Their `message` goes to the client as `{"detail": ...}` with the subclass's `status_code`. Anything else is logged and returned as a generic 500.

**Search is global:** `VectorStore.search` has no filter, so every query searches every ingested PDF. There is no concept of a user or chat yet.

**Embedding dimension:** `settings.embedding_dimensions` (3072) sets both the Gemini output size and the Qdrant collection size, but the collection is created only once. If you change the embedding model or dimension, delete the `docs` collection and `documents.db`, then re-upload every PDF.

**Not yet production-ready:** the Inngest client has `is_production=False`. There is no CORS middleware, because the frontend reaches the API through the Vite dev proxy (or the same origin in production).
