# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

All application code, the venv (`backend/env`), `.env`, and local data (`qdrant_storage/`, `uploads/`) live in `backend/`, which has its own `.gitignore`. Run every command from `backend/`; paths like `uploads/` are relative to the working directory.

Windows + PowerShell. `backend/.env` needs only `GEMINI_API_KEY` (used for both embeddings and answers). First-time setup: `python -m virtualenv env`, then `.\env\Scripts\python.exe -m pip install -r requirements.txt`.

Activate the venv with `.\env\Scripts\Activate.ps1`, and always invoke tools as `python -m ...`: Windows Smart App Control blocks the `.exe` launchers in `env\Scripts`. It can also block native DLLs such as `tiktoken` (which `SentenceSplitter` loads), so importing `data_loader` may fail in some shells for reasons unrelated to the code.

Start these in order, each in its own terminal:

1. Qdrant: `docker run -d --name qdrantRagDB -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant` (or `docker start qdrantRagDB` if it already exists). From Git Bash, prefix the command with `MSYS_NO_PATHCONV=1`, otherwise the `-v` path gets rewritten and the container mounts the wrong folder.
2. API: `python -m uvicorn main:app --reload`
3. Inngest dev server (dashboard at http://localhost:8288): `npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery`
4. UI (http://localhost:8501): `python -m streamlit run streamlit_app.py`

There is no test suite, linter, or build step. Run `python -m py_compile <files>` for a quick syntax check.

## Architecture

PDF RAG pipeline orchestrated by **Inngest**. The FastAPI app in `main.py` exists only to serve the two Inngest functions at `/api/inngest`. It has no REST endpoints of its own.

**Ingest** (`rag/ingest_pdf` event → `rag_ingest_pdf`):
- `data_loader.load_and_chunk_pdf` reads the PDF (llama-index `PDFReader`) and splits it into chunks of 1000 characters with 200 overlapping (`SentenceSplitter`).
- `data_loader.embed_texts` calls Gemini `batchEmbedContents` directly over REST with `requests`, in batches of 100.
- `QdrantStorage.upsert` writes the chunks to the Qdrant collection `docs`.
- Point IDs are `uuid5(source_id:i)`, so re-ingesting a file overwrites its earlier chunks. `source_id` is the bare filename, so two different files with the same name collide.
- The function is throttled (2 runs per minute) and rate-limited to 1 run per `source_id` every 4 hours. Repeat uploads of the same file are silently dropped; restart the Inngest dev server to reset this.

**Query** (`rag/query_pdf_ai` event → `rag_query_pdf_ai`):
- Embeds the question and searches Qdrant for the top-k chunks.
- Calls Gemini through `ctx.step.ai.infer` (Inngest's `gemini` adapter), trying each model in `ANSWER_MODELS` in order. A failed model raises `inngest.StepError` after `retries=1`, which is caught before moving to the next model.
- If every model fails, the function returns `RAGQueryResult` with `error` set instead of failing the run.
- Each model's step ID is `llm-answer-{model}`. Step IDs must stay deterministic for Inngest replay.
- The Gemini adapter writes `model` into the request body, so pass each call its own copy (`{**body}`).

**Search is global:** `QdrantStorage.search` has no filter, so every query searches every PDF ever ingested. There is no concept of a user or chat yet. Each chunk's payload is `{"source": source_id, "text": chunk}`.

**UI** (`streamlit_app.py`) never calls FastAPI directly. It saves uploads to `uploads/`, sends Inngest events, then polls the Inngest dev server's REST API (`INNGEST_API_BASE`, default `http://127.0.0.1:8288/v1`, `/events/{id}/runs`) until the run finishes, and renders `answer`, `sources`, and `error` from the run output.

**Shared contracts:** the Pydantic models in `custom_types.py` are the outputs of the Inngest steps and functions (`inngest.PydanticSerializer`). `RAGQueryResult` is also the shape the UI reads.

**Embedding dimension coupling:** `EMBEDDING_DIM = 3072` in `data_loader.py` must match `QdrantStorage(dim=3072)` in `vector_db.py`. The collection is created only if it doesn't exist yet. If you change the embedding model or dimension, delete the `docs` collection and re-ingest every PDF, because vectors from different models can't be compared.

## Brand colors

`#E1FF51`, `#00272C`, `#F2F2F2`
