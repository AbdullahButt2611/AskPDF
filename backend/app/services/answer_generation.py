from app.services.ollama import post_to_ollama

_SYSTEM_PROMPT = (
    "You answer questions using only the provided context. "
    # Small models get arithmetic wrong when they answer in one step; showing the working helps and lets users check it
    "If the answer requires a calculation (such as a duration, total, difference or count), "
    "first write out the relevant values and work through the calculation step by step, then state the final answer. "
    "If the context doesn't contain the answer, say so."
)


async def generate_answer(model: str, question: str, contexts: list[str]) -> str:
    context_block = "\n\n".join(f"- {context}" for context in contexts)
    user_prompt = (
        "Use the following context to answer the question:\n\n"
        f"Context: {context_block}\n\n"
        f"Question: {question}\n\n"
        "Answer concisely and accurately based on the context provided"
    )
    response = await post_to_ollama(
        "api/chat",
        {
            "model": model,
            "messages": [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            # Keeps the model in memory between questions so a pause doesn't add a reload
            "keep_alive": "30m",
            # Shorter cap keeps CPU-only answers responsive; concise answers fit comfortably
            "options": {"temperature": 0.2, "num_predict": 512},
        },
    )
    return response["message"]["content"].strip()
