import { RotateCw, SearchX } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { AmbientBackground } from '@/components/brand/AmbientBackground'
import { Highlight } from '@/components/brand/Highlight'
import { DropOverlay } from '@/components/feedback/DropOverlay'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAskQuestion } from '@/features/chat/queries'
import type { KnowledgeDocument } from '@/features/documents/api'
import { AddDocumentCard } from '@/features/documents/components/library/AddDocumentCard'
import { DocumentCard, UploadingCard } from '@/features/documents/components/library/DocumentCard'
import { LibraryToolbar, type StatusFilter } from '@/features/documents/components/library/LibraryToolbar'
import {
  useDeleteDocument,
  useDocuments,
  usePendingDeleteNames,
  usePendingUploadNames,
} from '@/features/documents/queries'
import { usePdfDropzone } from '@/features/documents/use-pdf-dropzone'
import { errorMessage } from '@/lib/api-client'
import { cn } from '@/lib/cn'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
// A pure crossfade (no movement) for swapping the grid, "no matches" and error views in the same slot
const SWAP = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
  transition: { duration: 0.25, ease: EASE_OUT },
}

export function KnowledgeBasePage() {
  const isStatic = useReducedMotion() ?? false
  const navigate = useNavigate()
  const { data: documents = [], isError, error, refetch, isRefetching } = useDocuments()
  const pendingUploadNames = usePendingUploadNames()
  const pendingDeleteNames = usePendingDeleteNames()
  const deleteDocument = useDeleteDocument()
  const { ask } = useAskQuestion()
  const { getRootProps, getInputProps, isDragActive, open, replaceDialog } = usePdfDropzone({
    noClick: true,
    noKeyboard: true,
  })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeDocument | null>(null)

  const counts: Record<StatusFilter, number> = {
    all: documents.length,
    ready: documents.filter((document) => document.status === 'ready').length,
    processing: documents.filter((document) => document.status === 'processing').length,
    failed: documents.filter((document) => document.status === 'failed').length,
  }
  const passageCount = documents.reduce((total, document) => total + document.chunkCount, 0)
  const normalizedQuery = query.trim().toLowerCase()
  const visibleDocuments = documents.filter(
    (document) =>
      (filter === 'all' || document.status === filter) && document.name.toLowerCase().includes(normalizedQuery),
  )
  const knownNames = new Set(documents.map((document) => document.name))
  const newUploadNames = pendingUploadNames.filter((name) => !knownNames.has(name))
  const isFiltering = normalizedQuery.length > 0 || filter !== 'all'
  const showNoMatches = isFiltering && visibleDocuments.length === 0 && newUploadNames.length === 0
  const isLibraryEmpty = documents.length === 0 && newUploadNames.length === 0

  const clearFilters = () => {
    setQuery('')
    setFilter('all')
  }

  const askAbout = (document: KnowledgeDocument) => {
    ask(`Summarize "${document.name.replace(/\.pdf$/i, '')}" in five bullet points`)
    navigate('/')
  }

  const confirmDelete = (document: KnowledgeDocument) =>
    deleteDocument
      .mutateAsync(document.name)
      .then(() => toast.success(`Deleted ${document.name}`, { description: 'Its embeddings were removed too.' }))
      .catch((deleteError: unknown) =>
        toast.error(`Couldn't Delete ${document.name}`, { description: errorMessage(deleteError) }),
      )

  const rise: Variants = {
    hidden: isStatic ? { opacity: 0 } : { opacity: 0, y: 20, filter: 'blur(6px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE_OUT } },
  }

  return (
    <div {...getRootProps({ className: 'relative isolate h-full outline-none' })}>
      <input {...getInputProps()} />
      <AmbientBackground />
      <DropOverlay visible={isDragActive} />
      {/* Only this inner element scrolls, so the background and drop overlay always cover the visible area */}
      <div className="h-full overflow-y-auto">

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: isStatic ? 0 : 0.08 } } }}
          className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10 lg:py-14"
        >
          <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <motion.p
                variants={rise}
                className="font-label text-[11px] font-semibold tracking-[0.14em] text-subtle uppercase"
              >
                Knowledge Base
              </motion.p>
              <motion.h1
                variants={rise}
                className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] tracking-[-0.03em] text-balance"
              >
                Everything AskPDF Has <Highlight delay={isStatic ? 0 : 0.6}>Read.</Highlight>
              </motion.h1>
              <motion.p variants={rise} className="mt-4 max-w-lg text-base leading-relaxed text-muted">
                Add PDFs to make them searchable from the Ask page. Remove one and its file and embeddings are deleted
                with it.
              </motion.p>
            </div>

            <motion.dl variants={rise} className="flex gap-8 sm:gap-10">
              {[
                { label: 'Documents', value: counts.all },
                { label: 'Passages', value: passageCount },
                { label: 'Processing', value: counts.processing },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse border-l border-border-strong pl-4">
                  <dt className="mt-1 font-label text-[11px] font-semibold tracking-wider text-subtle uppercase">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-3xl tabular-nums sm:text-4xl">{stat.value}</dd>
                </div>
              ))}
            </motion.dl>
          </header>

          <motion.div variants={rise}>
            <LibraryToolbar
              query={query}
              onQueryChange={setQuery}
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
              onAdd={open}
            />
          </motion.div>

          {/* One slot that swaps between grid, "no matches" and error, so nothing renders below a leaving card */}
          <motion.div variants={rise}>
            <AnimatePresence mode="wait" initial={false}>
              {isError && documents.length === 0 ? (
                <motion.div key="error" {...SWAP} className="rounded-card border border-border bg-surface p-10 text-center">
                  <p className="font-display text-xl">Couldn&apos;t Load Your Documents</p>
                  <p className="mt-1 text-sm text-muted">{errorMessage(error)}</p>
                  <Button variant="secondary" className="mt-5" onClick={() => refetch()} disabled={isRefetching}>
                    <RotateCw className={cn('size-4', isRefetching && 'animate-spin')} />
                    Try Again
                  </Button>
                </motion.div>
              ) : showNoMatches ? (
                <motion.div
                  key="no-matches"
                  {...SWAP}
                  className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong bg-surface/50 px-6 py-14 text-center backdrop-blur"
                >
                  <SearchX className="size-8 text-subtle" />
                  <p className="font-display text-xl">No Documents Match</p>
                  <p className="text-sm text-muted">Try a different name or status.</p>
                  <Button variant="secondary" size="sm" className="mt-1" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="grid" {...SWAP}>
                  <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Documents">
                    {!isFiltering && (
                      <li>
                        <AddDocumentCard onClick={open} />
                      </li>
                    )}
                    <AnimatePresence initial={false} mode="popLayout">
                      {newUploadNames.map((name) => (
                        <AnimatedItem key={`uploading-${name}`}>
                          <UploadingCard name={name} />
                        </AnimatedItem>
                      ))}
                      {visibleDocuments.map((document) => (
                        <AnimatedItem key={document.name}>
                          <DocumentCard
                            document={document}
                            activity={
                              pendingDeleteNames.includes(document.name)
                                ? 'deleting'
                                : pendingUploadNames.includes(document.name)
                                  ? 'uploading'
                                  : 'idle'
                            }
                            onAsk={askAbout}
                            onDelete={setDocumentToDelete}
                          />
                        </AnimatedItem>
                      ))}
                    </AnimatePresence>
                  </ul>
                  {isLibraryEmpty && (
                    <p className="mt-6 text-center text-sm text-muted">
                      Your library is empty. Add a PDF above, or drop one anywhere on this page.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <ConfirmDialog
          open={documentToDelete !== null}
          onOpenChange={(isOpen) => !isOpen && setDocumentToDelete(null)}
          title="Delete This Document?"
          description={
            <>
              <p className="font-label text-xs break-all text-text">{documentToDelete?.name}</p>
              <p className="mt-3">
                The file and its embeddings will be permanently removed, and answers will no longer use it.
              </p>
            </>
          }
          confirmLabel="Delete Document"
          tone="danger"
          onConfirm={() => documentToDelete && confirmDelete(documentToDelete)}
        />
        {replaceDialog}
      </div>
    </div>
  )
}

function AnimatedItem({ children }: { children: ReactNode }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      {children}
    </motion.li>
  )
}
