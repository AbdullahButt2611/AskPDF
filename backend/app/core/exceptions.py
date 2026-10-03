from fastapi import status


class AppError(Exception):
    """Base for errors whose message is safe to show to API clients."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidDocumentError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST


class DocumentNotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND


class DocumentExistsError(AppError):
    status_code = status.HTTP_409_CONFLICT


class DocumentTooLargeError(AppError):
    status_code = status.HTTP_413_CONTENT_TOO_LARGE


class ServiceUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class WorkflowFailedError(AppError):
    status_code = status.HTTP_502_BAD_GATEWAY


class WorkflowTimeoutError(AppError):
    status_code = status.HTTP_504_GATEWAY_TIMEOUT


class GeminiRequestError(Exception):
    """A Gemini API call failed in a way that may succeed on retry (network error, overload, 5xx)."""


class GeminiQuotaExceededError(GeminiRequestError):
    """Gemini rejected the call because the API key's quota or rate limit is used up (HTTP 429)."""
