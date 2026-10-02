from fastapi import APIRouter

from app.core.exceptions import ServiceUnavailableError
from app.schemas.query import AnswerResult, QueryRequest, QueryResponse
from app.services.workflow_runs import send_event, wait_for_run_output
from app.workflows.client import QUESTION_ASKED_EVENT

router = APIRouter(prefix="/queries", tags=["queries"])


@router.post("")
async def ask_question(request: QueryRequest) -> QueryResponse:
    event_id = await send_event(QUESTION_ASKED_EVENT, request.model_dump())
    result = AnswerResult.model_validate(await wait_for_run_output(event_id))
    if result.error:
        raise ServiceUnavailableError(result.error)
    return QueryResponse.model_validate(result.model_dump(exclude={"error"}))
