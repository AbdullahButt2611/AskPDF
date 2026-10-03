# CLAUDE.md (backend)

FastAPI app (package `app/`) plus the Inngest workflows that ingest PDFs and answer questions. Run every command from `backend/`.

## Setup and commands

- **AI runs locally through Ollama** (no API key). Install it, then `ollama pull nomic-embed-text` and `ollama pull llama3.2:3b`. `OLLAMA_URL` (default `http://localhost:11434`), `QDRANT_URL` and `INNGEST_API_BASE_URL` are optional `.env` overrides. Models and timeouts are set in `core/config.py`.
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
- `POST /api/queries` sends `rag/question.asked`, then polls the Inngest REST API (`/events/{id}/runs`) until the run finishes or `answer_timeout_seconds` passes, and returns the run's output. That endpoint can report `"Completed"` with a `null` output while a step is still executing, so a run only counts as finished once `ended_at` is set (`wait_for_run_output`).

**Workflows (`app/workflows/`):**
- **Retries:** both functions use `retries=settings.ai_max_retries` (2), so every AI call gets at most 1 attempt + 2 retries.
- **AI calls go through `services/ollama.post_to_ollama`,** which raises `AIServiceUnavailableError` when Ollama isn't reachable or the model isn't pulled (HTTP 404), and `AIRequestError` for retryable failures (timeouts, 5xx). Workflow steps convert `AIServiceUnavailableError` into `inngest.NonRetriableError`, which the SDK bubbles straight to the function without retrying, since retries can't help until Ollama or the model is there. The detailed reason (e.g. which `ollama pull` to run) is logged, and users get a friendly message. Services stay unaware of Inngest.
- `ingest-document`: chunks the PDF in a thread, embeds with `nomic-embed-text` (using its `search_document:` / `search_query:` task prefixes), and upserts with point IDs `uuid5(upload_id:i)`. Then `mark_ready` succeeds only if that `upload_id` is still current. If the file was replaced or deleted mid-run, the workflow deletes its own chunks by `upload_id`, so stale results never stay searchable. Unreadable PDFs, PDFs without text and an unavailable AI service raise `NonRetriableError` with a user-facing message. The `on_failure` handler (`_mark_ingestion_failed`) writes that message into the registry, or `_PROCESSING_FAILED_MESSAGE` for anything else. The function is throttled to 2 runs per minute.
- `answer-question`: retrieves top-k chunks and returns a fixed answer without calling the LLM when nothing matches. Otherwise it calls Ollama's `/api/chat` (`services/answer_generation.py`). The model is `answer_models[ctx.attempt % len(...)]`, so each retry switches model and the fallback stays within the retry limit. A `NonRetriableError` (AI unavailable) becomes the "AI service isn't available" message, and a `StepError` (retries exhausted) becomes the generic failure message. Both are returned as `AnswerResult.error`, which the route turns into a 503.
- Step IDs must stay deterministic for Inngest replay.
- A 500 on `/api/inngest` in the uvicorn log is how the SDK reports a step that raised an error. It's expected for failed ingestions.

**PDF text extraction (`services/pdf_processing.py`)** uses pypdf's `extraction_mode="layout"`. The default mode, which LlamaIndex's `PDFReader` uses, puts many PDFs one word per line (`"word
 
word"`), which wrecks embeddings, bloats prompts and slows CPU answers. The text is then normalized: NFKC Unicode (which fixes ligatures), undecodable characters removed, gaps of 6+ spaces turned into ` | ` table separators, and smaller gaps collapsed. Chunks are 512 tokens with 64 overlap, and fragments under 20 characters are dropped.

**Answer quality:** facts and lookups are reliable now that extraction is clean (the right passage ranks #1 in retrieval tests). Arithmetic, such as date differences, is not reliable with 3B models, even with the step-by-step instruction in the system prompt. `qwen2.5:3b` was tested and did worse than `llama3.2:3b`.

**Everything on the request path is async** (`httpx`, `AsyncQdrantClient`, and SQLite through `asyncio.to_thread`). The workflows run inside the same uvicorn process as the API, so blocking calls would stall `/api/queries` while it polls.

**Errors:** raise `AppError` subclasses from `core/exceptions.py`. Their `message` goes to the client as `{"detail": ...}` with the subclass's `status_code`. Anything else is logged and returned as a generic 500.

**Search is global:** `VectorStore.search` has no filter, so every query searches every ingested PDF. There is no concept of a user or chat yet.

**Embedding dimension:** `settings.embedding_dimensions` must equal the embedding model's output size (768 for `nomic-embed-text`), and `embed_texts` rejects vectors of any other size. On startup, `ensure_collection` compares it with the Qdrant collection: it recreates the collection if it's empty, and otherwise refuses to start with instructions. Vectors from different models can't share a collection, so after changing the embedding model, delete the `docs` collection and `documents.db`, then re-upload every PDF. Local generation on CPU is slow, so `ai_request_timeout_seconds` (180) and `answer_timeout_seconds` (300) are generous. The frontend's query timeout must stay longer than the latter.

**Not yet production-ready:** the Inngest client has `is_production=False`. There is no CORS middleware, because the frontend reaches the API through the Vite dev proxy (or the same origin in production).
