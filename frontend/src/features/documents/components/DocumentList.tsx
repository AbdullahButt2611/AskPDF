import { FileText, RotateCw, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Logo } from '@/components/brand/Logo'
import StatusMark, { type StatusMarkStatus } from '@/components/reactbits/StatusMark'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { errorMessage } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import { formatBytes, formatRelativeTime, pluralize } from '@/lib/format'

import type { DocumentStatus, KnowledgeDocument } from '../api'
import { useDeleteDocument, useDocuments, usePendingDeleteNames, usePendingUploadNames } from '../queries'

const STATUS_MARKS: Record<DocumentStatus, StatusMarkStatus> = {
  processing: 'running',
  ready: 'done',
  failed: 'failed',
}

export function DocumentList() {
  const { data: documents = [], isError, error, refetch, isRefetching } = useDocuments()
  const pendingUploadNames = usePendingUploadNames()
  const pendingDeleteNames = usePendingDeleteNames()
  const deleteDocument = useDeleteDocument()
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeDocument | null>(null)

  const knownNames = new Set(documents.map((document) => document.name))
  const newUploadNames = pendingUploadNames.filter((name) => !knownNames.has(name))

  const confirmDelete = (document: KnowledgeDocument) =>
    deleteDocument
      .mutateAsync(document.name)
      .then(() => toast.success(`Deleted ${document.name}`, { description: 'Its embeddings were removed too.' }))
      .catch((deleteError: unknown) =>
        toast.error(`Couldn't delete ${document.name}`, { description: errorMessage(deleteError) }),
      )

  if (isError && documents.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center">
        <p className="font-display text-lg">Couldn't load your documents</p>
        <p className="mt-1 text-sm text-muted">{errorMessage(error)}</p>
        <Button variant="secondary" className="mt-5" onClick={() => refetch()} disabled={isRefetching}>
          <RotateCw className={cn('size-4', isRefetching && 'animate-spin')} />
          Try again
        </Button>
      </div>
    )
  }

  if (documents.length === 0 && newUploadNames.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card border border-border bg-surface px-6 py-14 text-center">
        <Logo variant="mark" className="h-14 opacity-90" />
        <p className="mt-5 font-display text-xl">Your knowledge base is empty</p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Upload a PDF above. Once it's processed you can ask questions about it on the Ask page.
        </p>
      </div>
    )
  }

  return (
    <>
      <ul className="overflow-hidden rounded-card border border-border bg-surface">
        <AnimatePresence initial={false}>
          {newUploadNames.map((name) => (
            <DocumentRow key={`uploading-${name}`} name={name}>
              <StatusMark status="running" size={20} />
              <RowText name={name} meta="Uploading…" />
            </DocumentRow>
          ))}
          {documents.map((document) => {
            const isDeleting = pendingDeleteNames.includes(document.name)
            const isReplacing = pendingUploadNames.includes(document.name)
            return (
              <DocumentRow key={document.name} name={document.name} dimmed={isDeleting}>
                <StatusMark status={isReplacing ? 'running' : STATUS_MARKS[document.status]} size={20} />
                <RowText
                  name={document.name}
                  meta={isDeleting ? 'Removing…' : isReplacing ? 'Uploading new version…' : describeDocument(document)}
                  error={document.status === 'failed' && !isReplacing ? document.error : null}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${document.name}`}
                  disabled={isDeleting || isReplacing}
                  onClick={() => setDocumentToDelete(document)}
                  className="hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </Button>
              </DocumentRow>
            )
          })}
        </AnimatePresence>
      </ul>

      <ConfirmDialog
        open={documentToDelete !== null}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        title="Delete this document?"
        description={
          <>
            <p className="font-label text-xs break-all text-text">{documentToDelete?.name}</p>
            <p className="mt-3">
              The file and its embeddings will be permanently removed, and answers will no longer use it.
            </p>
          </>
        }
        confirmLabel="Delete document"
        tone="danger"
        onConfirm={() => documentToDelete && confirmDelete(documentToDelete)}
      />
    </>
  )
}

function DocumentRow({ name, dimmed = false, children }: { name: string; dimmed?: boolean; children: ReactNode }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: dimmed ? 0.5 : 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="border-b border-border last:border-b-0"
      aria-label={name}
    >
      <div className="flex items-center gap-4 px-5 py-4">{children}</div>
    </motion.li>
  )
}

function RowText({ name, meta, error }: { name: string; meta: string; error?: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-2 font-medium">
        <FileText className="size-4 shrink-0 text-subtle" />
        <span className="truncate">{name}</span>
      </p>
      <p className="mt-1 font-label text-[11px] tracking-wide text-subtle">{meta}</p>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}

function describeDocument(document: KnowledgeDocument) {
  const uploaded = formatRelativeTime(document.uploadedAt)
  if (document.status === 'processing') return `${formatBytes(document.sizeBytes)} · Processing… · ${uploaded}`
  if (document.status === 'failed') return `${formatBytes(document.sizeBytes)} · Failed · ${uploaded}`
  return `${formatBytes(document.sizeBytes)} · ${pluralize(document.chunkCount, 'passage')} · ${uploaded}`
}
