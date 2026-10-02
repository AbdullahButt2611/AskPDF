# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout and setup

Two independent Python projects, each with its own venv (`env/`), `requirements.txt`, and `.gitignore`:
- `backend/`: FastAPI app (package `app/`), plus `.env` and local data (`qdrant_storage/`, `uploads/`)
- `frontend/`: Streamlit UI (`streamlit_app.py`), which only talks to the backend over HTTP (`BACKEND_URL`, default `http://localhost:8000`)

Windows + PowerShell. `backend/.env` needs `GEMINI_API_KEY`; the app refuses to start without it. First-time setup in each folder: `python -m virtualenv env`, then `.\env\Scripts\python.exe -m pip install -r requirements.txt`. Always invoke tools as `python -m ...`, because Windows Smart App Control blocks the `.exe` launchers in `env\Scripts`.

Both `requirements.txt` files are fully pinned and contain exactly each side's dependency closure. When adding a package, install it and pin it together with any new transitive dependencies.

`pyrightconfig.json` in the repo root points Pylance at `backend/env` and, for `frontend/`, at `frontend/env`. Run `npx pyright` from the root for a type check; it should report 0 errors. There is no test suite or linter.

## Running locally

Start these in order, each in its own terminal:
1. Qdrant, from `backend/`: `docker run -d --name qdrantRagDB -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant` (or `docker start qdrantRagDB`). From Git Bash, prefix the command with `MSYS_NO_PATHCONV=1`, otherwise the `-v` path gets rewritten and the container mounts the wrong folder.
2. API, from `backend/`: `python -m uvicorn app.main:app --reload`. Startup fails if Qdrant isn't reachable, because the lifespan hook creates the collection.
3. Inngest dev server: `npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery`
4. UI, from `frontend/`: `python -m streamlit run streamlit_app.py`

## Backend architecture

`app/main.py` mounts the routers under `/api`, serves the Inngest functions at `/api/inngest`, and registers the exception handlers. The rest of the package is layered as `api/routes` → `services` → `workflows`, with Pydantic models in `schemas/` and settings in `core/config.py` (a frozen `Settings` dataclass; only `GEMINI_API_KEY`, `QDRANT_URL`, and `INNGEST_API_BASE_URL` come from the environment).

**Request flow:** API routes don't do the RAG work themselves. They send an Inngest event (`services/workflow_runs.send_event`), and the Inngest dev server then calls back into this same process to run the workflow.
- `POST /api/documents` validates the PDF (extension, `%PDF-` signature, 20 MB limit, filename stripped of directory parts), saves it to `uploads/`, sends `rag/document.uploaded`, and returns 202 right away. Clients have no way to learn when ingestion finishes.
- `POST /api/queries` sends `rag/question.asked`, then polls the Inngest REST API (`/events/{id}/runs`) until the run finishes or `answer_timeout_seconds` passes, and returns the run's output.

**Workflows (`app/workflows/`):**
- `ingest-document`: chunks the PDF in a thread, embeds with Gemini, and upserts to Qdrant. Point IDs are `uuid5(source_id:i)`, and `source_id` is the bare filename, so files with the same name overwrite each other. The function is throttled (2 runs per minute) and rate-limited to 1 run per `source_id` every 4 hours, so repeat uploads of the same file are silently dropped; restart the Inngest dev server to reset this.
- `answer-question`: retrieves top-k chunks and returns a fixed answer without calling the LLM when nothing matches. Otherwise it calls `ctx.step.ai.infer` with each model in `settings.answer_models` in turn, catching `inngest.StepError` (raised after `retries=1`) to move to the next model. If every model fails, it returns `AnswerResult.error`, which the route turns into a 503.
- Step IDs (`llm-answer-{model}`) must stay deterministic for Inngest replay.
- The Gemini adapter writes `model` into the request body, so each call gets its own copy (`{**request_body}`).

**Everything on the request path is async** (`httpx`, `AsyncQdrantClient`). The workflows run inside the same uvicorn process as the API, so blocking calls would stall `/api/queries` while it polls. Wrap any blocking work in `asyncio.to_thread`, as `pdf_processing` is.

**Errors:** raise `AppError` subclasses from `core/exceptions.py`. Their `message` goes to the client as `{"detail": ...}` with the subclass's `status_code`. Anything else is logged and returned as a generic 500. Inside workflows, use `inngest.NonRetriableError` for failures that retrying won't fix. `EmbeddingError` carries Gemini's own error message into the Inngest run logs.

**Search is global:** `VectorStore.search` has no filter, so every query searches every PDF ever ingested. There is no concept of a user or chat yet. Each chunk's payload is `{"source": source_id, "text": chunk}`.

**Embedding dimension:** `settings.embedding_dimensions` (3072) sets both the Gemini output size and the Qdrant collection size, but the collection is created only once. If you change the embedding model or dimension, delete the `docs` collection and re-ingest every PDF.

## Brand colors

`#E1FF51`, `#00272C`, `#F2F2F2`
