import asyncio
import sqlite3
from collections.abc import Callable
from contextlib import closing
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.schemas.document import DocumentResponse, DocumentStatus

_SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    source_id TEXT PRIMARY KEY,
    upload_id TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    status TEXT NOT NULL,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    uploaded_at TEXT NOT NULL
)
"""
_COLUMNS = "source_id, size_bytes, status, chunk_count, error, uploaded_at"


class DocumentRegistry:
    """Tracks uploaded documents. `upload_id` identifies the current upload of each file,
    so a workflow for a replaced or deleted upload can tell that its results are stale."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path

    async def initialize(self) -> None:
        await self._run(lambda conn: conn.execute(_SCHEMA))

    async def list(self) -> list[DocumentResponse]:
        rows = await self._run(
            lambda conn: conn.execute(f"SELECT {_COLUMNS} FROM documents ORDER BY uploaded_at DESC").fetchall()
        )
        return [_to_document(row) for row in rows]

    async def get(self, source_id: str) -> DocumentResponse | None:
        row = await self._run(
            lambda conn: conn.execute(
                f"SELECT {_COLUMNS} FROM documents WHERE source_id = ?", (source_id,)
            ).fetchone()
        )
        return _to_document(row) if row else None

    async def register_upload(
        self,
        source_id: str,
        upload_id: str,
        size_bytes: int,
        status: DocumentStatus = "processing",
        chunk_count: int = 0,
    ) -> DocumentResponse:
        uploaded_at = datetime.now(UTC).isoformat()
        await self._run(
            lambda conn: conn.execute(
                """
                INSERT INTO documents (source_id, upload_id, size_bytes, status, chunk_count, error, uploaded_at)
                VALUES (?, ?, ?, ?, ?, NULL, ?)
                ON CONFLICT(source_id) DO UPDATE SET
                    upload_id = excluded.upload_id,
                    size_bytes = excluded.size_bytes,
                    status = excluded.status,
                    chunk_count = excluded.chunk_count,
                    error = NULL,
                    uploaded_at = excluded.uploaded_at
                """,
                (source_id, upload_id, size_bytes, status, chunk_count, uploaded_at),
            )
        )
        return DocumentResponse(
            source_id=source_id,
            size_bytes=size_bytes,
            status=status,
            chunk_count=chunk_count,
            error=None,
            uploaded_at=datetime.fromisoformat(uploaded_at),
        )

    async def mark_ready(self, source_id: str, upload_id: str, chunk_count: int) -> bool:
        """Returns False when the upload is no longer current (replaced or deleted)."""
        return await self._update_status(source_id, upload_id, "ready", chunk_count=chunk_count)

    async def mark_failed(self, source_id: str, upload_id: str, error: str) -> bool:
        return await self._update_status(source_id, upload_id, "failed", error=error)

    async def delete(self, source_id: str) -> None:
        await self._run(lambda conn: conn.execute("DELETE FROM documents WHERE source_id = ?", (source_id,)))

    async def _update_status(
        self,
        source_id: str,
        upload_id: str,
        status: DocumentStatus,
        chunk_count: int = 0,
        error: str | None = None,
    ) -> bool:
        cursor = await self._run(
            lambda conn: conn.execute(
                "UPDATE documents SET status = ?, chunk_count = ?, error = ? WHERE source_id = ? AND upload_id = ?",
                (status, chunk_count, error, source_id, upload_id),
            )
        )
        return cursor.rowcount > 0

    async def _run(self, operation: Callable[[sqlite3.Connection], Any]) -> Any:
        def run_in_transaction() -> Any:
            with closing(sqlite3.connect(self._db_path)) as conn, conn:
                return operation(conn)

        return await asyncio.to_thread(run_in_transaction)


def _to_document(row: tuple) -> DocumentResponse:
    source_id, size_bytes, status, chunk_count, error, uploaded_at = row
    return DocumentResponse(
        source_id=source_id,
        size_bytes=size_bytes,
        status=status,
        chunk_count=chunk_count,
        error=error,
        uploaded_at=datetime.fromisoformat(uploaded_at),
    )


document_registry = DocumentRegistry(settings.documents_db_path)
