import os

import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
UPLOAD_TIMEOUT_SECONDS = 60
# Slightly longer than the backend's own answer timeout so its error message reaches the user
QUERY_TIMEOUT_SECONDS = 150
BACKEND_UNREACHABLE_MESSAGE = "Can't reach the backend. Make sure the API server is running."


class BackendError(Exception):
    pass


def call_backend(method: str, path: str, timeout: float, **kwargs) -> dict:
    try:
        response = requests.request(method, f"{BACKEND_URL}{path}", timeout=timeout, **kwargs)
    except requests.Timeout as exc:
        raise BackendError("The request took too long. Please try again.") from exc
    except requests.RequestException as exc:
        raise BackendError(BACKEND_UNREACHABLE_MESSAGE) from exc

    if response.ok:
        return response.json()
    raise BackendError(_error_detail(response))


def _error_detail(response: requests.Response) -> str:
    try:
        detail = response.json().get("detail")
    except ValueError:
        detail = None
    if isinstance(detail, str):
        return detail
    if response.status_code == 422:
        return "Please check your input and try again."
    return "Something went wrong. Please try again."


st.set_page_config(page_title="RAG Ingest PDF", page_icon="📄", layout="centered")

st.title("Upload a PDF to Ingest")
uploaded = st.file_uploader("Choose a PDF", type=["pdf"], accept_multiple_files=False)

# Streamlit reruns the whole script on every interaction; only upload each file once
if uploaded is not None and st.session_state.get("last_uploaded_file_id") != uploaded.file_id:
    try:
        with st.spinner("Uploading and triggering ingestion..."):
            document = call_backend(
                "POST",
                "/api/documents",
                timeout=UPLOAD_TIMEOUT_SECONDS,
                files={"file": (uploaded.name, uploaded.getvalue(), "application/pdf")},
            )
    except BackendError as exc:
        st.error(str(exc))
    else:
        st.session_state["last_uploaded_file_id"] = uploaded.file_id
        st.success(f"Triggered ingestion for: {document['source_id']}")
        st.caption("You can upload another PDF if you like.")

st.divider()
st.title("Ask a question about your PDFs")

with st.form("rag_query_form"):
    question = st.text_input("Your question")
    top_k = st.number_input("How many chunks to retrieve", min_value=1, max_value=20, value=5, step=1)
    submitted = st.form_submit_button("Ask")

    if submitted and question.strip():
        try:
            with st.spinner("Generating answer..."):
                result = call_backend(
                    "POST",
                    "/api/queries",
                    timeout=QUERY_TIMEOUT_SECONDS,
                    json={"question": question.strip(), "top_k": int(top_k)},
                )
        except BackendError as exc:
            st.warning(str(exc))
        else:
            st.subheader("Answer")
            st.write(result["answer"] or "(No answer)")
            if result["sources"]:
                st.caption("Sources")
                for source in result["sources"]:
                    st.write(f"- {source}")
