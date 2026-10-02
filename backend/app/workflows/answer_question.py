from typing import Any, cast

import inngest
from inngest.experimental.ai import gemini

from app.core.config import settings
from app.schemas.query import AnswerResult, RetrievedContext
from app.services.embeddings import embed_texts
from app.services.vector_store import vector_store
from app.workflows.client import QUESTION_ASKED_EVENT, inngest_client

_SYSTEM_PROMPT = "You answer questions using only the provided context"
_NO_CONTEXT_ANSWER = "I couldn't find anything relevant to your question in the uploaded documents."
_MODELS_UNAVAILABLE_MESSAGE = "The AI service is busy right now. Please try again in a minute."


@inngest_client.create_function(
    fn_id="answer-question",
    name="Answer question",
    trigger=inngest.TriggerEvent(event=QUESTION_ASKED_EVENT),
    retries=1,  # The user is waiting; fall back to another model instead of long backoffs
)
async def answer_question(ctx: inngest.Context) -> dict[str, Any]:
    question = str(ctx.event.data["question"])
    top_k = int(cast(int, ctx.event.data["top_k"]))

    retrieved = await ctx.step.run(
        "embed-and-search", _retrieve_context, question, top_k, output_type=RetrievedContext
    )
    if not retrieved.contexts:
        return AnswerResult(answer=_NO_CONTEXT_ANSWER, sources=[], num_contexts=0).model_dump()

    request_body = _build_request_body(question, retrieved.contexts)
    for model in settings.answer_models:
        try:
            response = await ctx.step.ai.infer(
                f"llm-answer-{model}",
                adapter=gemini.Adapter(auth_key=settings.gemini_api_key, model=model),
                body={**request_body},  # The adapter writes "model" into the body, so each call needs its own copy
            )
        except inngest.StepError as exc:
            ctx.logger.warning(f"{model} failed, trying the next model: {exc}")
            continue

        return AnswerResult(
            answer=_extract_answer_text(response),
            sources=retrieved.sources,
            num_contexts=len(retrieved.contexts),
        ).model_dump()

    return AnswerResult(
        answer="",
        sources=retrieved.sources,
        num_contexts=len(retrieved.contexts),
        error=_MODELS_UNAVAILABLE_MESSAGE,
    ).model_dump()


async def _retrieve_context(question: str, top_k: int) -> RetrievedContext:
    [query_vector] = await embed_texts([question])
    return await vector_store.search(query_vector, limit=top_k)


def _build_request_body(question: str, contexts: list[str]) -> dict[str, Any]:
    context_block = "\n\n".join(f"- {context}" for context in contexts)
    user_prompt = (
        "Use the following context to answer the question:\n\n"
        f"Context: {context_block}\n\n"
        f"Question: {question}\n\n"
        "Answer concisely and accurately based on the context provided"
    )
    return {
        "systemInstruction": {"parts": [{"text": _SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.2},
    }


def _extract_answer_text(response: dict[str, Any]) -> str:
    candidates = response.get("candidates") or [{}]
    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts).strip()
