import { apiRequest } from '@/lib/api-client'

// Mirrors the backend's upload limit so oversized files are rejected before uploading
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

export type DocumentStatus = 'processing' | 'ready' | 'failed'

export interface KnowledgeDocument {
  name: string
  sizeBytes: number
  status: DocumentStatus
  chunkCount: number
  error: string | null
  uploadedAt: Date
}

interface DocumentPayload {
  source_id: string
  size_bytes: number
  status: DocumentStatus
  chunk_count: number
  error: string | null
  uploaded_at: string
}

function toKnowledgeDocument(payload: DocumentPayload): KnowledgeDocument {
  return {
    name: payload.source_id,
    sizeBytes: payload.size_bytes,
    status: payload.status,
    chunkCount: payload.chunk_count,
    error: payload.error,
    uploadedAt: new Date(payload.uploaded_at),
  }
}

export async function fetchDocuments() {
  const documents = await apiRequest<DocumentPayload[]>('/api/documents')
  return documents.map(toKnowledgeDocument)
}

export async function uploadDocument({ file, overwrite }: { file: File; overwrite: boolean }) {
  const body = new FormData()
  body.append('file', file)
  const document = await apiRequest<DocumentPayload>(`/api/documents?overwrite=${overwrite}`, {
    method: 'POST',
    body,
    timeoutMs: 120_000,
  })
  return toKnowledgeDocument(document)
}

export function deleteDocument(name: string) {
  return apiRequest<void>(`/api/documents/${encodeURIComponent(name)}`, { method: 'DELETE' })
}
