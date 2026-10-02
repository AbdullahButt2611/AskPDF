from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.core.config import settings
from app.schemas.query import RetrievedContext


class VectorStore:
    def __init__(self, url: str, collection_name: str, vector_size: int) -> None:
        self._client = AsyncQdrantClient(url=url, timeout=30)
        self._collection_name = collection_name
        self._vector_size = vector_size

    async def ensure_collection(self) -> None:
        if not await self._client.collection_exists(self._collection_name):
            await self._client.create_collection(
                collection_name=self._collection_name,
                vectors_config=VectorParams(size=self._vector_size, distance=Distance.COSINE),
            )

    async def upsert(self, ids: list[str], vectors: list[list[float]], payloads: list[dict]) -> None:
        points = [
            PointStruct(id=point_id, vector=vector, payload=payload)
            for point_id, vector, payload in zip(ids, vectors, payloads, strict=True)
        ]
        await self._client.upsert(collection_name=self._collection_name, points=points)

    async def search(self, query_vector: list[float], limit: int) -> RetrievedContext:
        response = await self._client.query_points(
            collection_name=self._collection_name,
            query=query_vector,
            limit=limit,
            with_payload=True,
        )

        contexts: list[str] = []
        sources: set[str] = set()
        for point in response.points:
            payload = point.payload or {}
            if text := payload.get("text"):
                contexts.append(text)
                sources.add(payload.get("source", ""))

        return RetrievedContext(contexts=contexts, sources=sorted(sources))


vector_store = VectorStore(
    url=settings.qdrant_url,
    collection_name=settings.qdrant_collection,
    vector_size=settings.embedding_dimensions,
)
