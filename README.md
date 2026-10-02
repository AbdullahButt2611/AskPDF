# RAG AI Agent

All code lives in `backend/`. Run every command below from inside it (`cd backend`).

Set `GEMINI_API_KEY` (embeddings + answers) in `backend/.env`. Get one at https://aistudio.google.com/apikey.

First-time setup (PowerShell):
`python -m virtualenv env` then `.\env\Scripts\python.exe -m pip install -r requirements.txt`

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



Color Code:
#E1FF51
#00272C
#F2F2F2



Let's Start the actual implementation. First I need you to review this complete code and understand it throughly without missing anything. The code currently is very basic level and is not well-written at all. Now I want to make this project a production level application right now. 

First I need you to convert this entire code into a folder named backend. And inside it this environemnt and everything should be present. You can even remove this environment in the root and create a new one using `python -m virtualenv env` in the backend directory and then install all dependencies from requirements and adjust if anything needs to be adjusted for this to work properly. 

Make sure the backend has its own gitignore file which hold only the gitignore files of the backend itself. 
