# AskPDF

Upload PDFs, ask questions in plain language, and get answers drawn only from your documents, with their sources listed.

- `backend/`: FastAPI API, Inngest workflows, Qdrant vector search, and local AI through Ollama (embeddings and answers, no API key)
- `frontend/`: React + TypeScript app (Ask, Knowledge Base, Settings with light/dark themes)

## Prerequisites

- Python 3.14, Node.js 24+, and [Docker Desktop](https://www.docker.com/products/docker-desktop/) (it must be running before you start Qdrant)
- Ollama, installed in the first setup step below

## First-time setup (PowerShell)

1. **Install Ollama and download the two models** (about 2.3 GB in total, CPU-friendly):
   ```powershell
   winget install --id Ollama.Ollama --exact --source winget --accept-package-agreements
   ollama pull nomic-embed-text
   ollama pull llama3.2:3b
   ```
   Open a **new terminal** after installing, so `ollama` is on your PATH (or call `"$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"` directly). Ollama then runs as a background app that starts with Windows. Check it with `ollama list`.

2. **Backend**, from `backend/`:
   ```powershell
   python -m virtualenv env
   .\env\Scripts\python.exe -m pip install -r requirements.txt
   ```
   Always use `python -m ...`, because Windows Smart App Control blocks the `.exe` launchers in `env\Scripts`.

   **If the API later fails with "An Application Control policy has blocked this file"** (Smart App Control blocking SQLAlchemy's compiled DLL), reinstall SQLAlchemy as pure Python. Rerun this after every fresh `pip install -r requirements.txt`, because that brings the compiled version back:
   ```powershell
   $env:DISABLE_SQLALCHEMY_CEXT=1; .\env\Scripts\python.exe -m pip install --force-reinstall --no-deps --no-binary SQLAlchemy SQLAlchemy==2.1.1
   ```

3. **Frontend**, from `frontend/`:
   ```powershell
   npm install
   ```

No `.env` file is required. Optional overrides go in `backend/.env`: `OLLAMA_URL` (default `http://localhost:11434`), `QDRANT_URL` (default `http://localhost:6333`), and `INNGEST_API_BASE_URL` (default `http://127.0.0.1:8288/v1`). For the frontend, set `VITE_BACKEND_URL` in `frontend/.env.local` if the API isn't at `http://localhost:8000`.

## Running

Make sure Docker Desktop and Ollama are running, then start each of these in its own terminal, in this order:

1. **Qdrant**, from `backend/` (first time):
   ```powershell
   docker run -d --name qdrantRagDB -p 6333:6333 -v "${PWD}/qdrant_storage:/qdrant/storage" qdrant/qdrant
   ```
   Afterwards, use `docker start qdrantRagDB`. In Git Bash, prefix the `docker run` command with `MSYS_NO_PATHCONV=1`, otherwise the storage folder gets mounted in the wrong place.
2. **API**, from `backend/` with the venv active (`.\env\Scripts\Activate.ps1`). Docs at http://localhost:8000/docs.
   ```powershell
   python -m uvicorn app.main:app --reload
   ```
3. **Inngest dev server** (dashboard at http://localhost:8288). Uploads stay on "processing" until this is running.
   ```powershell
   npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest --no-discovery
   ```
4. **Frontend**, from `frontend/` (opens at http://localhost:5173):
   ```powershell
   npm run dev
   ```

## Troubleshooting

- **"The AI service isn't available"** on a document or an answer means Ollama isn't running or a model is missing. Run `ollama list`, start the Ollama app if needed, and pull any missing model. The API log names the exact cause.
- **The API won't start and says the Qdrant collection holds vectors of a different size.** This happens after changing the embedding model, because vectors from different models can't be mixed. Reset the stored embeddings, then upload your PDFs again. With Qdrant running, from `backend/`:
  ```powershell
  Invoke-RestMethod -Method Delete http://localhost:6333/collections/docs
  Remove-Item documents.db
  ```
- **Answers are slow** (about 1 minute on CPU). That's expected for a local model; asking several questions at once makes each one slower.

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




