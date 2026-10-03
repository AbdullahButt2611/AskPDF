from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import DocumentTooLargeError, InvalidDocumentError

_PDF_SIGNATURE = b"%PDF-"


async def read_validated_pdf(upload: UploadFile) -> tuple[str, bytes]:
    filename = _safe_filename(upload.filename)
    content = await upload.read(settings.max_upload_size_bytes + 1)

    if len(content) > settings.max_upload_size_bytes:
        limit_mb = settings.max_upload_size_bytes // (1024 * 1024)
        raise DocumentTooLargeError(f"'{filename}' is larger than the {limit_mb} MB upload limit.")
    if not content.startswith(_PDF_SIGNATURE):
        raise InvalidDocumentError(f"'{filename}' is empty or not a valid PDF file.")
    return filename, content


def save_pdf(filename: str, content: bytes) -> Path:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    destination = settings.upload_dir / filename
    destination.write_bytes(content)
    return destination


def delete_pdf(filename: str) -> None:
    (settings.upload_dir / filename).unlink(missing_ok=True)


def list_stored_pdfs() -> list[Path]:
    if not settings.upload_dir.exists():
        return []
    return [path for path in settings.upload_dir.iterdir() if path.suffix.lower() == ".pdf"]


def _safe_filename(raw_filename: str | None) -> str:
    # Drop any client-supplied directory parts so uploads can't escape upload_dir
    filename = Path((raw_filename or "").replace("\\", "/")).name
    if not filename.lower().endswith(".pdf"):
        raise InvalidDocumentError("Please upload a file with a .pdf extension.")
    return filename
