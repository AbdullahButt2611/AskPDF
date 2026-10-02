import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env")


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is not set. Add it to backend/.env.")
    return value


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 3072
    # Tried in order; later models are fallbacks when earlier ones are overloaded or failing
    answer_models: tuple[str, ...] = ("gemini-3.5-flash-lite", "gemini-2.5-flash-lite")

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "docs"

    inngest_api_base_url: str = "http://127.0.0.1:8288/v1"
    answer_timeout_seconds: float = 120.0

    upload_dir: Path = BACKEND_DIR / "uploads"
    max_upload_size_bytes: int = 20 * 1024 * 1024


settings = Settings(
    gemini_api_key=_require_env("GEMINI_API_KEY"),
    qdrant_url=os.getenv("QDRANT_URL", Settings.qdrant_url),
    inngest_api_base_url=os.getenv("INNGEST_API_BASE_URL", Settings.inngest_api_base_url),
)
