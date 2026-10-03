from typing import Any, cast

import inngest

from app.core.config import settings
from app.core.exceptions import AIServiceUnavailableError
from app.schemas.query import AnswerResult, RetrievedContext
from app.services.answer_generation import generate_answer
from app.services.embeddings import embed_texts
from app.services.vector_store import vector_store
from app.workflows.client import QUESTION_ASKED_EVENT, inngest_client

_NO_CONTEXT_ANSWER = "I couldn't find anything relevant to your question in the uploaded documents."
_AI_UNAVAILABLE_MESSAGE = (
    "The AI service isn't available right now, so we can't answer questions. "
    "Please try again in a while, or contact support if this keeps happening."
)
_ANSWER_FAILED_MESSAGE = (
    "Something went wrong while generating your answer. Please try again in a moment, "
    "or contact support if the problem continues."
)


@inngest_client.create_function(
    fn_id="answer-question",
    name="Answer question",
    trigger=inngest.TriggerEvent(event=QUESTION_ASKED_EVENT),
    retries=settings.ai_max_retries,
)
async def answer_question(ctx: inngest.Context) -> dict[str, Any]:
    question = str(ctx.event.data["question"])
    top_k = int(cast(int, ctx.event.data["top_k"]))
    # Each retry switches model, so an overloaded model doesn't use up every attempt
    model = settings.answer_models[ctx.attempt % len(settings.answer_models)]

    try:
        retrieved = await ctx.step.run(
            "embed-and-search", _retrieve_context, question, top_k, output_type=RetrievedContext
        )
        if not retrieved.contexts:
            return AnswerResult(answer=_NO_CONTEXT_ANSWER, sources=[], num_contexts=0).model_dump()

        answer = await ctx.step.run("generate-answer", _generate_answer, model, question, retrieved.contexts)
    except inngest.NonRetriableError as exc:
        ctx.logger.error(f"Answering failed: {exc}")
        return _failed_result(_AI_UNAVAILABLE_MESSAGE)
    except inngest.StepError as exc:
        ctx.logger.error(f"Answering failed after {settings.ai_max_retries} retries: {exc.name}: {exc.message}")
        return _failed_result(_ANSWER_FAILED_MESSAGE)

    return AnswerResult(answer=answer, sources=retrieved.sources, num_contexts=len(retrieved.contexts)).model_dump()


async def _retrieve_context(question: str, top_k: int) -> RetrievedContext:
    try:
        [query_vector] = await embed_texts([question], purpose="query")
    except AIServiceUnavailableError as exc:
        raise inngest.NonRetriableError(str(exc)) from None
    return await vector_store.search(query_vector, limit=top_k)


async def _generate_answer(model: str, question: str, contexts: list[str]) -> str:
    try:
        return await generate_answer(model, question, contexts)
    except AIServiceUnavailableError as exc:
        raise inngest.NonRetriableError(str(exc)) from None


def _failed_result(message: str) -> dict[str, Any]:
    return AnswerResult(answer="", sources=[], num_contexts=0, error=message).model_dump()
