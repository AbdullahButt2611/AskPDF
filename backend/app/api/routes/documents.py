from fastapi import APIRouter, Response, UploadFile, status

from app.schemas.document import DocumentResponse
from app.services import documents

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("")
async def list_documents() -> list[DocumentResponse]:
    return await documents.list_documents()


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def upload_document(file: UploadFile, overwrite: bool = False) -> DocumentResponse:
    return await documents.upload_document(file, overwrite=overwrite)


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(source_id: str) -> Response:
    await documents.delete_document(source_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
