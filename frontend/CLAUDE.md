# CLAUDE.md — frontend

Streamlit UI in a single file, `streamlit_app.py`. Run every command from `frontend/`.

## Setup and commands

- First-time setup: `python -m virtualenv env`, then `.\env\Scripts\python.exe -m pip install -r requirements.txt`. This venv is separate from the backend's.
- `requirements.txt` is fully pinned and contains exactly Streamlit's dependency closure plus `requests` and `python-dotenv`.
- Run with `python -m streamlit run streamlit_app.py` (http://localhost:8501). The backend must be running; see `../backend/CLAUDE.md`.
- Set `BACKEND_URL` in `frontend/.env` if the API isn't at `http://localhost:8000`.
- Smoke-test without a browser using `streamlit.testing.v1.AppTest`: load the app, fill `text_input[0]`, click `button[0]`, then inspect `subheader`, `markdown`, and `warning`.

## How it works

- **The backend is the only dependency.** The frontend doesn't import backend code or talk to Inngest or Qdrant. It calls two endpoints: `POST /api/documents` (multipart field `file`) and `POST /api/queries` (`{"question", "top_k"}` → `{"answer", "sources", "num_contexts"}`).
- **All HTTP calls go through `call_backend`,** which turns timeouts, connection failures, and non-2xx responses into `BackendError`. The message is the backend's `detail` string when there is one, and a generic message for 422 validation errors and unknown failures. Show `BackendError` messages to the user as they are.
- **`QUERY_TIMEOUT_SECONDS` (150) must stay longer than the backend's `answer_timeout_seconds` (120),** so that the backend's own timeout message reaches the user instead of a client-side timeout.
- **Streamlit reruns the whole script on every interaction.** The upload is guarded by `st.session_state["last_uploaded_file_id"]` so each file is sent only once. Keep that guard if you restructure the upload flow.
