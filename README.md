# RAG AI Agent

The project has two parts, each with its own virtualenv, `requirements.txt` and `.gitignore`:

- `backend/`: FastAPI API plus the Inngest workflows that ingest PDFs and answer questions
- `frontend/`: Streamlit UI, which talks to the backend only through its HTTP API

Set `GEMINI_API_KEY` (embeddings + answers) in `backend/.env`. Get one at https://aistudio.google.com/apikey.

First-time setup, run once in each of `backend/` and `frontend/` (PowerShell):
`python -m virtualenv env` then `.\env\Scripts\python.exe -m pip install -r requirements.txt`

Activate a folder's virtualenv with `.\env\Scripts\Activate.ps1`.
(Use `python -m ...` because Windows Smart App Control blocks the `.exe` launchers in `env\Scripts`.)

Run each of these in its own terminal, in this order:

1. Qdrant, from `backend/`
`docker run -d --name qdrantRagDB -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant`
(already created? `docker start qdrantRagDB`)

2. API, from `backend/` (interactive docs at http://localhost:8000/docs)
`python -m uvicorn app.main:app --reload`

3. Inngest dev server (dashboard at http://localhost:8288)
`npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery`

4. Streamlit UI, from `frontend/` (opens at http://localhost:8501)
`python -m streamlit run streamlit_app.py`

Set `BACKEND_URL` in `frontend/.env` if the API isn't running at `http://localhost:8000`.

Color Code:
#E1FF51
#00272C
#F2F2F2



Now for the backend I want you to work on it properly and turn this code from simple python to properly structured FastAPI Code. Make sure you first understand what are the best practices being followed, how the code is written, how the comments are added. Make sure the comments are added only when explicitly needed. Don't add for no reason at all. 

Also structure the code into their dediated directory structure and make the imports properly. Also name the files and variables meaningfully following the best practices. 

Also follow the best practices for handling exceptions correctly and the errors messages should be meaningful for the user and organize the imports correctly as well. 

Move the Streamlit app outside the backend and make it access the backend through APIs as well. 
