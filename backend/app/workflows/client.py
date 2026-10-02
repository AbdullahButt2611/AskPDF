import logging

import inngest

DOCUMENT_UPLOADED_EVENT = "rag/document.uploaded"
QUESTION_ASKED_EVENT = "rag/question.asked"

inngest_client = inngest.Inngest(
    app_id="rag_app",
    logger=logging.getLogger("uvicorn"),
    is_production=False,
    serializer=inngest.PydanticSerializer(),
)
