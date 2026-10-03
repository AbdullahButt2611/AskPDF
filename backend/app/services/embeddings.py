from app.core.config import settings
from app.services.gemini import post_to_gemini

_BATCH_SIZE = 100  # Gemini's cap on requests per batchEmbedContents call


async def embed_texts(texts: list[str]) -> list[list[float]]:
    vectors: list[list[float]] = []
    for start in range(0, len(texts), _BATCH_SIZE):
        response = await post_to_gemini(
            f"models/{settings.embedding_model}:batchEmbedContents",
            {
                "requests": [
                    {
                        "model": f"models/{settings.embedding_model}",
                        "content": {"parts": [{"text": text}]},
                        "outputDimensionality": settings.embedding_dimensions,
                    }
                    for text in texts[start:start + _BATCH_SIZE]
                ]
            },
        )
        vectors.extend(item["values"] for item in response["embeddings"])
    return vectors
