from typing import Literal

from app.core.config import settings
from app.core.exceptions import AIServiceUnavailableError
from app.services.ollama import post_to_ollama

_BATCH_SIZE = 32

# nomic-embed-text is trained with these task prefixes; using them noticeably improves retrieval
_TASK_PREFIXES = {"document": "search_document: ", "query": "search_query: "}


async def embed_texts(texts: list[str], purpose: Literal["document", "query"]) -> list[list[float]]:
    prefix = _TASK_PREFIXES[purpose]
    vectors: list[list[float]] = []
    for start in range(0, len(texts), _BATCH_SIZE):
        response = await post_to_ollama(
            "api/embed",
            {
                "model": settings.embedding_model,
                "input": [f"{prefix}{text}" for text in texts[start:start + _BATCH_SIZE]],
                "truncate": True,
                "keep_alive": "30m",
            },
        )
        vectors.extend(response["embeddings"])

    if vectors and len(vectors[0]) != settings.embedding_dimensions:
        raise AIServiceUnavailableError(
            f"{settings.embedding_model} returned {len(vectors[0])}-dimensional vectors, but "
            f"embedding_dimensions is {settings.embedding_dimensions}. Update the setting to match the model."
        )
    return vectors
