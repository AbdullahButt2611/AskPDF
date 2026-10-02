from fastapi import APIRouter, UploadFile, status

from app.schemas.document import DocumentUploadResponse
from app.services.document_storage import save_uploaded_pdf
from app.services.workflow_runs import send_event
from app.workflows.client import DOCUMENT_UPLOADED_EVENT

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def upload_document(file: UploadFile) -> DocumentUploadResponse:
    pdf_path = await save_uploaded_pdf(file)
    await send_event(
        DOCUMENT_UPLOADED_EVENT,
        {"pdf_path": str(pdf_path), "source_id": pdf_path.name},
    )
    return DocumentUploadResponse(source_id=pdf_path.name)
