# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

PDF question-answering (RAG) app built on Gemini embeddings and answers, Qdrant for vector search, and Inngest for orchestration. It has two independent Python projects, each with its own venv (`env/`), pinned `requirements.txt`, `.gitignore`, and `CLAUDE.md`:

- **`backend/`**: FastAPI API plus the Inngest workflows. See `backend/CLAUDE.md`.
- **`frontend/`**: Streamlit UI, which talks to the backend only over HTTP. See `frontend/CLAUDE.md`.

Read the relevant one before working in either folder. Never install packages for one project into the other's venv.

## Shared conventions

- **Windows + PowerShell.** Always invoke tools as `python -m ...`, because Windows Smart App Control blocks the `.exe` launchers in `env\Scripts`.
- **Startup order:** Qdrant → backend API → Inngest dev server → Streamlit. The commands are in each folder's `CLAUDE.md`, and `README.md` has the full walkthrough.
- **Type checking:** `pyrightconfig.json` in the repo root points Pylance at `backend/env` and, for `frontend/`, at `frontend/env`. Run `npx pyright` from the root; it should report 0 errors. There is no test suite or linter.

## Brand colors

`#E1FF51`, `#00272C`, `#F2F2F2`
