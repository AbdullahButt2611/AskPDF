from typing import Any

from app.services.gemini import post_to_gemini

_SYSTEM_PROMPT = "You answer questions using only the provided context"


async def generate_answer(model: str, question: str, contexts: list[str]) -> str:
    response = await post_to_gemini(f"models/{model}:generateContent", _build_request_body(question, contexts))
    return _extract_answer_text(response)


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
