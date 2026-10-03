from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import GeminiQuotaExceededError, GeminiRequestError

_REQUEST_TIMEOUT_SECONDS = 60


async def post_to_gemini(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    """POSTs to a Gemini REST endpoint, e.g. `models/gemini-2.5-flash-lite:generateContent`."""
    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{settings.gemini_base_url}/{path}",
                headers={"x-goog-api-key": settings.gemini_api_key},
                json=payload,
            )
    except httpx.HTTPError as exc:
        raise GeminiRequestError(f"Could not reach the Gemini API: {exc}") from exc

    if response.status_code == httpx.codes.TOO_MANY_REQUESTS:
        raise GeminiQuotaExceededError(f"Gemini quota exceeded: {_error_message(response)}")
    if response.is_error:
        raise GeminiRequestError(f"Gemini request failed ({response.status_code}): {_error_message(response)}")
    return response.json()


def _error_message(response: httpx.Response) -> str:
    try:
        return response.json()["error"]["message"]
    except (ValueError, KeyError, TypeError):
        return response.text
