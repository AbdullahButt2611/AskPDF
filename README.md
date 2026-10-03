# AskPDF

Upload PDFs, ask questions in plain language, and get answers drawn only from your documents, with their sources listed.

- `backend/`: FastAPI API, Inngest workflows, Qdrant vector search, and local AI through Ollama (embeddings and answers, no API key)
- `frontend/`: React + TypeScript app (Ask, Knowledge Base, Settings with light/dark themes)

## First-time setup

1. Install [Ollama](https://ollama.com/download) and pull the two models (about 2.3 GB in total, CPU-friendly):
   `ollama pull nomic-embed-text` and `ollama pull llama3.2:3b`
2. Backend, from `backend/` (PowerShell):
   `python -m virtualenv env` then `.\env\Scripts\python.exe -m pip install -r requirements.txt`
   (Use `python -m ...` because Windows Smart App Control blocks the `.exe` launchers in `env\Scripts`. If the API fails with "An Application Control policy has blocked this file", see `backend/CLAUDE.md`.)
3. Frontend, from `frontend/`: `npm install`

## Running

Run each of these in its own terminal, in this order:

1. Qdrant, from `backend/`
   `docker run -d --name qdrantRagDB -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant`
   (already created? `docker start qdrantRagDB`)
2. API, from `backend/` with the venv active (`.\env\Scripts\Activate.ps1`). Docs at http://localhost:8000/docs.
   `python -m uvicorn app.main:app --reload`
3. Inngest dev server (dashboard at http://localhost:8288)
   `npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery`
4. Frontend, from `frontend/` (opens at http://localhost:5173)
   `npm run dev`

The frontend proxies `/api` to `http://localhost:8000`. Set `VITE_BACKEND_URL` in `frontend/.env.local` if the API runs elsewhere.

Brand colors: `#E1FF51` · `#00272C` · `#F2F2F2`



Now for the Frontend part, I want to get rid of the streamlit app. Instead we want to make use of ReactJS and using it we will be preparing the complete application. Make sure you follow the best practices while preparing the React Application and its structure should also be how the production level applications have it. The code should be clean and also avoid usigg UseEffect for no reason. Use the correct libraries and correct thing for the implementation where its necessary. 

Use the colors which I have mentioned below and also prepare the corresponding dark mode as well. And for this prepare a settings option from where the user can select the preferences for Dark and light mode.
Color Code:
#E1FF51
#00272C
#F2F2F2

Now below are the fonts which I want you to use in the application. For this you have to install by yourself and make sure you keep them locally. And keep only those which you are actually using
Fonts
Bricolage Grotesque (Bold) for the logo wordmark and headlines.
Hanken Grotesk for body text.
JetBrains Mono for small labels and page references.

I have placed the logos in the logo ddirectory inside the frontend directory when prepare the complete structure I need you to make sure that you place them in their correct directory and as per the preference of the user, use these logos as well based on Dark and Light theme

Now for the UI part, I want to have an option for the Knowledge Base where the user can upload its file and can manage its files directly. It should clearly show the files which have been uploaded and if the user wants to remove those files from here, it should delete those files in our system as well as its embeddings as well. Make sure this is handled correctly. 

If the user uploads a file which already exists in the system, the system should prompt the user that uploading the file with the same name will oevrrite the file as well. 

Use https://reactbits.dev/get-started/index library for preparing this complete system. Combine it with the custom updation to align it with our system. Also for the colors and fonts make the codes and use that everywhere so we can easily change it in future in case we need to. 

Make sure the Loading screen is awesome prepared and also when the response will be coming from the AI at the point the loading should be superbly creative.




