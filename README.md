# RAG AI Agent

Set `OPENAI_API_KEY` (embeddings) and `XAI_API_KEY` (Grok answers) in `.env`.

Activate the virtualenv first (PowerShell):
`.\env\Scripts\Activate.ps1`

(Use `python -m ...` — Windows Smart App Control blocks the `.exe` launchers in `env\Scripts`.)

Run each of these in its own terminal, in this order:

1. Qdrant
`docker run -d --name qdrantRagDB -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant`
(already created? `docker start qdrantRagDB`)

2. FastAPI server
`python -m uvicorn main:app --reload`
OR
`python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`

3. Inngest dev server (dashboard at http://localhost:8288)
`npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery`

4. Streamlit UI (opens at http://localhost:8501)
`python -m streamlit run streamlit_app.py`
