import httpx

from app.core.config import settings
from app.core.exceptions import EmbeddingError

_BATCH_SIZE = 100  # Gemini's cap on requests per batchEmbedContents call
_EMBED_URL = f"{settings.gemini_base_url}/models/{settings.embedding_model}:batchEmbedContents"


async def embed_texts(texts: list[str]) -> list[list[float]]:
    vectors: list[list[float]] = []
    async with httpx.AsyncClient(timeout=60) as client:
        for start in range(0, len(texts), _BATCH_SIZE):
            batch = texts[start:start + _BATCH_SIZE]
            vectors.extend(await _embed_batch(client, batch))
    return vectors


async def _embed_batch(client: httpx.AsyncClient, texts: list[str]) -> list[list[float]]:
    payload = {
        "requests": [
            {
                "model": f"models/{settings.embedding_model}",
                "content": {"parts": [{"text": text}]},
                "outputDimensionality": settings.embedding_dimensions,
            }
            for text in texts
        ]
    }
    try:
        response = await client.post(
            _EMBED_URL,
            headers={"x-goog-api-key": settings.gemini_api_key},
            json=payload,
        )
    except httpx.HTTPError as exc:
        raise EmbeddingError(f"Could not reach the Gemini embeddings API: {exc}") from exc

    if response.is_error:
        raise EmbeddingError(
            f"Gemini embeddings request failed ({response.status_code}): {_gemini_error_message(response)}"
        )
    return [item["values"] for item in response.json()["embeddings"]]


def _gemini_error_message(response: httpx.Response) -> str:
    try:
        return response.json()["error"]["message"]
    except (ValueError, KeyError, TypeError):
        return response.text
