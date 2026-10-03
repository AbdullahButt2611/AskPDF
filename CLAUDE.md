# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

AskPDF is a PDF question-answering (RAG) app. It uses Gemini for embeddings and answers, Qdrant for vector search, and Inngest for orchestration. It has two independent projects, each with its own dependencies, `.gitignore`, and `CLAUDE.md`:

- **`backend/`**: Python. FastAPI API, Inngest workflows, and a document registry. See `backend/CLAUDE.md`.
- **`frontend/`**: React + TypeScript + Vite. Ask, Knowledge Base and Settings pages, talking to the backend only over HTTP (`/api`). See `frontend/CLAUDE.md`.

Read the relevant one before working in either folder.

## Shared conventions

- **Windows + PowerShell.** For Python, always invoke tools as `python -m ...`, because Windows Smart App Control blocks the `.exe` launchers in `backend\env\Scripts`.
- **Startup order:** Qdrant → backend API → Inngest dev server → `npm run dev` in `frontend/`. The commands are in each folder's `CLAUDE.md`, and `README.md` has the full walkthrough.
- **Checks:** run `npx pyright` from the root for the backend (`pyrightconfig.json` points at `backend/env`), and `npm run build` and `npm run lint` in `frontend/`. All should report zero errors. There is no automated test suite.
- **Brand:** deep teal `#00272C`, lime `#E1FF51`, off-white `#F2F2F2`. Fonts: Bricolage Grotesque (wordmark and headlines), Hanken Grotesk (body), JetBrains Mono (labels). In code they're defined only in `frontend/src/styles/theme.css`.
