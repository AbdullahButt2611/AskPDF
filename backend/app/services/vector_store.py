from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    FilterSelector,
    MatchValue,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)

from app.core.config import settings
from app.schemas.query import RetrievedContext


_MAX_FACET_SOURCES = 10_000


class VectorStore:
    def __init__(self, url: str, collection_name: str, vector_size: int) -> None:
        self._client = AsyncQdrantClient(url=url, timeout=30)
        self._collection_name = collection_name
        self._vector_size = vector_size

    async def ensure_collection(self) -> None:
        if await self._client.collection_exists(self._collection_name):
            await self._recreate_if_vector_size_changed()
        else:
            await self._create_collection()
        for field_name in ("source", "upload_id"):
            await self._client.create_payload_index(
                collection_name=self._collection_name,
                field_name=field_name,
                field_schema=PayloadSchemaType.KEYWORD,
            )

    async def _create_collection(self) -> None:
        await self._client.create_collection(
            collection_name=self._collection_name,
            vectors_config=VectorParams(size=self._vector_size, distance=Distance.COSINE),
        )

    async def _recreate_if_vector_size_changed(self) -> None:
        """Vectors from different embedding models can't share a collection, even at the same size."""
        info = await self._client.get_collection(self._collection_name)
        vectors_config = info.config.params.vectors
        current_size = vectors_config.size if isinstance(vectors_config, VectorParams) else None
        if current_size == self._vector_size:
            return
        if info.points_count:
            raise RuntimeError(
                f"Qdrant collection '{self._collection_name}' holds {info.points_count} vectors of size "
                f"{current_size}, but the embedding model produces {self._vector_size}. Delete the collection "
                "and backend/documents.db, then upload your documents again."
            )
        await self._client.delete_collection(self._collection_name)
        await self._create_collection()

    async def upsert(self, ids: list[str], vectors: list[list[float]], payloads: list[dict]) -> None:
        points = [
            PointStruct(id=point_id, vector=vector, payload=payload)
            for point_id, vector, payload in zip(ids, vectors, payloads, strict=True)
        ]
        await self._client.upsert(collection_name=self._collection_name, points=points)

    async def count_by_source(self, source_id: str) -> int:
        result = await self._client.count(
            collection_name=self._collection_name,
            count_filter=_payload_filter("source", source_id),
            exact=True,
        )
        return result.count

    async def list_sources(self) -> set[str]:
        response = await self._client.facet(
            collection_name=self._collection_name, key="source", limit=_MAX_FACET_SOURCES, exact=True
        )
        # The payload index can keep reporting values of deleted points with a count of 0
        return {str(hit.value) for hit in response.hits if hit.count > 0}

    async def delete_by_source(self, source_id: str) -> None:
        await self._delete_matching("source", source_id)

    async def delete_by_upload(self, upload_id: str) -> None:
        await self._delete_matching("upload_id", upload_id)

    async def _delete_matching(self, key: str, value: str) -> None:
        await self._client.delete(
            collection_name=self._collection_name,
            points_selector=FilterSelector(filter=_payload_filter(key, value)),
            wait=True,
        )

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


def _payload_filter(key: str, value: str) -> Filter:
    return Filter(must=[FieldCondition(key=key, match=MatchValue(value=value))])


vector_store = VectorStore(
    url=settings.qdrant_url,
    collection_name=settings.qdrant_collection,
    vector_size=settings.embedding_dimensions,
)
