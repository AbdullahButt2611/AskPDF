<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="frontend/src/assets/logo/askpdf-logo-dark-mode.svg">
    <img src="frontend/src/assets/logo/askpdf-logo-light-mode.svg" alt="AskPDF" width="300">
  </picture>
</p>

<p align="center">
  Ask your PDFs anything. Every answer comes from your own documents, cites its sources, and is generated on your machine.
</p>

## See It in Action

[▶ Watch the 20-second demo](brag-output/brag.mp4): upload a PDF, ask a question, and get an answer with its sources.

## Features

- **Answers grounded in your documents.** Each answer lists the passages it was drawn from.
- **Knowledge Base.** Upload, track and delete PDFs. Deleting a file also removes its embeddings.
- **Fully local AI.** Embeddings and answers run on CPU through Ollama. No cloud account or API key.
- **Reliable processing.** Ingestion runs as a background workflow with retries and clear error messages.
- **Light and dark themes**, selectable in Settings.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Motion |
| API | FastAPI, Pydantic, Uvicorn |
| Workflows | Inngest |
| Vector search | Qdrant |
| AI models | Ollama: `nomic-embed-text` (embeddings), `llama3.2:3b` (answers) |
| PDF parsing | pypdf, LlamaIndex |
| Document registry | SQLite |

## How It Works

1. **Upload.** The API validates the PDF, saves it and triggers an Inngest workflow.
2. **Ingest.** The workflow extracts the text, splits it into passages, embeds them with Ollama and stores them in Qdrant.
3. **Ask.** A question is embedded, the closest passages are retrieved from Qdrant, and the answer model replies using only those passages.

## Project Structure

```
├── backend/     FastAPI API, Inngest workflows, document registry
└── frontend/    React app: Ask, Knowledge Base and Settings
```

## Prerequisites

- Windows with PowerShell
- [Python 3.14](https://www.python.org/downloads/)
- [Node.js 24+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Ollama](https://ollama.com/), installed in step 1 below

## First-Time Setup

Run these once, in order.

**1. Install Ollama and download the models** (about 2.3 GB):

```powershell
winget install --id Ollama.Ollama --exact --source winget --accept-package-agreements
```

Open a new terminal so `ollama` is on your PATH, then:

```powershell
ollama pull nomic-embed-text
ollama pull llama3.2:3b
```

Ollama runs in the background and starts with Windows. `ollama list` should show both models.

**2. Install the backend**, from `backend/`:

```powershell
python -m virtualenv env
.\env\Scripts\python.exe -m pip install -r requirements.txt
```

**3. Install the frontend**, from `frontend/`:

```powershell
npm install
```

**4. Create the Qdrant container**, from `backend/`, with Docker Desktop running:

```powershell
docker run -d --name qdrantRagDB -p 6333:6333 -v "${PWD}/qdrant_storage:/qdrant/storage" qdrant/qdrant
```

In Git Bash, prefix this command with `MSYS_NO_PATHCONV=1`, or the storage folder is mounted in the wrong place.

## Running the App

Make sure Docker Desktop and Ollama are running. Then start each service in its own terminal, in this order:

| # | Service | Directory | Command |
| --- | --- | --- | --- |
| 1 | Qdrant | any | `docker start qdrantRagDB` |
| 2 | API | `backend/` | `.\env\Scripts\python.exe -m uvicorn app.main:app --reload` |
| 3 | Inngest dev server | any | `npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery` |
| 4 | Frontend | `frontend/` | `npm run dev` |

Open **http://localhost:5173**. Uploads stay on "Processing" until the Inngest dev server is running.

| Service | URL |
| --- | --- |
| App | http://localhost:5173 |
| API docs | http://localhost:8000/docs |
| Inngest dashboard | http://localhost:8288 |
| Qdrant dashboard | http://localhost:6333/dashboard |

## Configuration

No configuration is required. To change the defaults, add these optional overrides:

| Variable | File | Default |
| --- | --- | --- |
| `OLLAMA_URL` | `backend/.env` | `http://localhost:11434` |
| `QDRANT_URL` | `backend/.env` | `http://localhost:6333` |
| `INNGEST_API_BASE_URL` | `backend/.env` | `http://127.0.0.1:8288/v1` |
| `VITE_BACKEND_URL` | `frontend/.env.local` | `http://localhost:8000` |

## Troubleshooting

**"The AI service isn't available."** Ollama isn't running or a model is missing. Run `ollama list`, start Ollama if needed, and pull any missing model. The API log names the exact cause.

**The API fails with "An Application Control policy has blocked this file."** Windows Smart App Control is blocking SQLAlchemy's compiled library. Reinstall it as pure Python from `backend/`, and repeat this after every `pip install -r requirements.txt`:

```powershell
$env:DISABLE_SQLALCHEMY_CEXT=1; .\env\Scripts\python.exe -m pip install --force-reinstall --no-deps --no-binary SQLAlchemy SQLAlchemy==2.1.1
```

**The API won't start because the Qdrant collection holds vectors of a different size.** The embedding model changed, and vectors from different models can't share a collection. With Qdrant running, reset the stored data from `backend/`, then upload your PDFs again:

```powershell
Invoke-RestMethod -Method Delete http://localhost:6333/collections/docs
Remove-Item documents.db
```

**Answers take about a minute.** That's expected for a local model on CPU. Several questions at once make each one slower.
