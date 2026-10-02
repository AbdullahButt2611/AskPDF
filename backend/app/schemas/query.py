from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class QueryResponse(BaseModel):
    answer: str
    sources: list[str]
    num_contexts: int


class RetrievedContext(BaseModel):
    contexts: list[str]
    sources: list[str]


class AnswerResult(QueryResponse):
    error: str | None = None
