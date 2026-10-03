import asyncio
import logging
import time
from typing import Any

import httpx
import inngest

from app.core.config import settings
from app.core.exceptions import ServiceUnavailableError, WorkflowFailedError, WorkflowTimeoutError
from app.workflows.client import inngest_client

logger = logging.getLogger(__name__)

_POLL_INTERVAL_SECONDS = 0.5
_COMPLETED_STATUSES = {"Completed", "Succeeded", "Success", "Finished"}
_FAILED_STATUSES = {"Failed", "Cancelled"}


async def send_event(name: str, data: dict[str, Any]) -> str:
    try:
        event_ids = await inngest_client.send(inngest.Event(name=name, data=data))
    except Exception as exc:
        logger.exception("Failed to send Inngest event %s", name)
        raise ServiceUnavailableError(
            "The processing service is unavailable right now. Please try again in a moment."
        ) from exc
    return event_ids[0]


async def wait_for_run_output(event_id: str) -> dict[str, Any]:
    deadline = time.monotonic() + settings.answer_timeout_seconds
    async with httpx.AsyncClient(base_url=settings.inngest_api_base_url, timeout=10) as client:
        while time.monotonic() < deadline:
            run = await _fetch_latest_run(client, event_id)
            # This endpoint can report "Completed" while a step is still executing; only an end time is reliable
            if run is not None and run.get("ended_at"):
                status = run.get("status")
                if status in _COMPLETED_STATUSES:
                    return run.get("output") or {}
                if status in _FAILED_STATUSES:
                    logger.error("Workflow run for event %s ended with status %s", event_id, status)
                    raise WorkflowFailedError("We couldn't generate an answer this time. Please try again.")
            await asyncio.sleep(_POLL_INTERVAL_SECONDS)

    raise WorkflowTimeoutError("Generating the answer took too long. Please try again in a moment.")


async def _fetch_latest_run(client: httpx.AsyncClient, event_id: str) -> dict[str, Any] | None:
    try:
        response = await client.get(f"/events/{event_id}/runs")
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.exception("Failed to fetch runs for event %s", event_id)
        raise ServiceUnavailableError(
            "The processing service is unavailable right now. Please try again in a moment."
        ) from exc
    runs = response.json().get("data") or []
    return runs[0] if runs else None
