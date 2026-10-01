import datetime
import logging
import os
import typing
import uuid

import inngest
import inngest.fast_api
from dotenv import load_dotenv
from fastapi import FastAPI
from inngest.experimental.ai import grok

from custom_types import (
    RAGChunkAndSrc,
    RAGQueryResult,
    RAGSearchResult,
    RAGUpsertResult,
)
from data_loader import embed_texts, load_and_chunk_pdf
from vector_db import QdrantStorage

load_dotenv()


inngest_client = inngest.Inngest(
    app_id='rag_app',
    logger=logging.getLogger("uvicorn"),
    is_production=False,
    serializer=inngest.PydanticSerializer()
)


@inngest_client.create_function(
    fn_id = "RAG: Ingest PDF",
    trigger = inngest.TriggerEvent(event="rag/ingest_pdf"),
    throttle=inngest.Throttle(
        limit=2,
        period=datetime.timedelta(minutes=1),
    ),
    rate_limit=inngest.RateLimit(
        limit=1,
        period=datetime.timedelta(hours=4),
        key="event.data.source_id",
    ),
)
async def rag_ingest_pdf(ctx: inngest.Context) -> dict[str, typing.Any]:
    async def _load(pdf_path: str, source_id: str) -> RAGChunkAndSrc:
        chunks = load_and_chunk_pdf(pdf_path)
        return RAGChunkAndSrc(chunk=chunks, source_id=source_id)

    async def _upsert(chunks_and_src: RAGChunkAndSrc) -> RAGUpsertResult:
        chunks = chunks_and_src.chunk
        source_id = chunks_and_src.source_id
        vectors = embed_texts(chunks)
        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source_id}:{i}")) for i in range(len(chunks))]
        payloads = [{"source": source_id, "text": chunks[i]} for i in range(len(chunks))]
        QdrantStorage().upsert(ids, vectors, payloads)
        return RAGUpsertResult(ingested=len(chunks))

    pdf_path = str(ctx.event.data["pdf_path"])
    source_id = str(ctx.event.data.get("source_id", pdf_path))

    chunks_and_src = await ctx.step.run("load-and-chunks", _load, pdf_path, source_id, output_type=RAGChunkAndSrc)
    ingested = await ctx.step.run("embed-and-upsert", _upsert, chunks_and_src, output_type=RAGUpsertResult)

    return ingested.model_dump()


@inngest_client.create_function(
    fn_id = "RAG: Query PDF",
    trigger = inngest.TriggerEvent(event="rag/query_pdf_ai"),
)
async def rag_query_pdf_ai(ctx: inngest.Context) -> dict[str, typing.Any]:
    async def _search(question: str, top_k: int) -> RAGSearchResult:
        query_vector = embed_texts([question])[0]
        found = QdrantStorage().search(query_vector, top_k=top_k)
        return RAGSearchResult(contexts=found["contexts"], sources=found["sources"])

    question = str(ctx.event.data["question"])
    top_k = int(typing.cast(int, ctx.event.data.get("top_k", 5)))

    found = await ctx.step.run("embed-and-search", _search, question, top_k, output_type=RAGSearchResult)

    context_block = "\n\n".join(f"- {context}" for context in found.contexts)
    user_content = (
        "Use the following context to answer the question:\n\n"
        f"Context: {context_block}\n\n"
        f"Question: {question}\n\n"
        "Answer concisely and accurately based on the context provided"
    )

    adapter = grok.Adapter(
        auth_key=os.environ["XAI_API_KEY"],
        model="grok-4.3",
    )

    response = await ctx.step.ai.infer(
        "llm-answer",
        adapter=adapter,
        body = {
            "max_tokens": 1024,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": "You answer questions using only the provided context"},
                {"role": "user", "content": user_content},
            ],
        }
    )

    choices = typing.cast(list[dict[str, typing.Any]], response["choices"])
    answer = str(choices[0]["message"]["content"]).strip()
    return RAGQueryResult(answer=answer, sources=found.sources, num_contexts=len(found.contexts)).model_dump()


app = FastAPI()

inngest.fast_api.serve(app, inngest_client, [rag_ingest_pdf, rag_query_pdf_ai])
