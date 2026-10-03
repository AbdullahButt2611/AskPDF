from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import AIRequestError, AIServiceUnavailableError


async def post_to_ollama(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    """POSTs to the local Ollama API, e.g. `api/embed` or `api/chat`."""
    try:
        async with httpx.AsyncClient(timeout=settings.ai_request_timeout_seconds) as client:
            response = await client.post(f"{settings.ollama_url}/{path}", json=payload)
    except httpx.ConnectError as exc:
        raise AIServiceUnavailableError(f"Ollama isn't reachable at {settings.ollama_url}. Is it running?") from exc
    except httpx.HTTPError as exc:
        raise AIRequestError(f"Ollama request failed: {exc!r}") from exc

    if response.status_code == httpx.codes.NOT_FOUND:
        model = payload.get("model")
        raise AIServiceUnavailableError(f"Model '{model}' isn't installed. Run: ollama pull {model}")
    if response.is_error:
        raise AIRequestError(f"Ollama request failed ({response.status_code}): {_error_message(response)}")
    return response.json()


def _error_message(response: httpx.Response) -> str:
    try:
        return response.json()["error"]
    except (ValueError, KeyError, TypeError):
        return response.text
