from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import DocumentTooLargeError, InvalidDocumentError

_PDF_SIGNATURE = b"%PDF-"


async def save_uploaded_pdf(upload: UploadFile) -> Path:
    filename = _safe_filename(upload.filename)
    content = await upload.read(settings.max_upload_size_bytes + 1)

    if len(content) > settings.max_upload_size_bytes:
        limit_mb = settings.max_upload_size_bytes // (1024 * 1024)
        raise DocumentTooLargeError(f"'{filename}' is larger than the {limit_mb} MB upload limit.")
    if not content.startswith(_PDF_SIGNATURE):
        raise InvalidDocumentError(f"'{filename}' is empty or not a valid PDF file.")

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    destination = settings.upload_dir / filename
    destination.write_bytes(content)
    return destination


def _safe_filename(raw_filename: str | None) -> str:
    # Drop any client-supplied directory parts so uploads can't escape upload_dir
    filename = Path((raw_filename or "").replace("\\", "/")).name
    if not filename.lower().endswith(".pdf"):
        raise InvalidDocumentError("Please upload a file with a .pdf extension.")
    return filename
