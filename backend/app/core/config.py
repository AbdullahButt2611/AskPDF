import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    ollama_url: str = "http://localhost:11434"
    embedding_model: str = "nomic-embed-text"
    # Must equal the embedding model's output size; the Qdrant collection is sized from it
    embedding_dimensions: int = 768
    # Each retry of an answer moves to the next model, so a fallback works within the retry limit
    answer_models: tuple[str, ...] = ("llama3.2:3b",)
    # Retries after the first attempt for any AI call (embeddings and answers)
    ai_max_retries: int = 2
    # Local models on CPU are slow; one generation can take well over a minute
    ai_request_timeout_seconds: float = 180.0

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "docs"

    inngest_api_base_url: str = "http://127.0.0.1:8288/v1"
    answer_timeout_seconds: float = 300.0

    upload_dir: Path = BACKEND_DIR / "uploads"
    documents_db_path: Path = BACKEND_DIR / "documents.db"
    max_upload_size_bytes: int = 20 * 1024 * 1024


settings = Settings(
    ollama_url=os.getenv("OLLAMA_URL", Settings.ollama_url),
    qdrant_url=os.getenv("QDRANT_URL", Settings.qdrant_url),
    inngest_api_base_url=os.getenv("INNGEST_API_BASE_URL", Settings.inngest_api_base_url),
)
