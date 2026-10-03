import { AlertTriangle, FileText, MessageSquareText, Trash2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import StatusMark, { type StatusMarkStatus } from '@/components/reactbits/StatusMark'
import { cn } from '@/lib/cn'
import { formatBytes, formatRelativeTime, pluralize } from '@/lib/format'

import type { KnowledgeDocument } from '../../api'

export type CardActivity = 'idle' | 'uploading' | 'deleting'

const STATUS: Record<KnowledgeDocument['status'], { mark: StatusMarkStatus; label: string }> = {
  processing: { mark: 'running', label: 'Processing' },
  ready: { mark: 'done', label: 'Ready' },
  failed: { mark: 'failed', label: 'Failed' },
}

interface DocumentCardProps {
  document: KnowledgeDocument
  activity: CardActivity
  onAsk: (document: KnowledgeDocument) => void
  onDelete: (document: KnowledgeDocument) => void
}

/** A document as a page: the logo's cut corner and fold, live status, and actions revealed on hover or focus. */
export function DocumentCard({ document, activity, onAsk, onDelete }: DocumentCardProps) {
  const isStatic = useReducedMotion() ?? false
  const isBusy = activity !== 'idle'
  const isFailed = document.status === 'failed' && !isBusy
  const isWorking = document.status === 'processing' || activity === 'uploading'
  const status =
    activity === 'uploading'
      ? { mark: 'running' as const, label: 'Uploading' }
      : activity === 'deleting'
        ? { mark: 'running' as const, label: 'Removing' }
        : STATUS[document.status]

  return (
    <article
      className={cn(
        'group relative flex h-full min-h-56 flex-col overflow-hidden rounded-[1.4rem] border bg-surface p-5 shadow-[0_20px_44px_-34px_var(--shadow-color)] transition-[transform,box-shadow,border-color,opacity] duration-300 [clip-path:polygon(0_0,calc(100%-2.75rem)_0,100%_2.75rem,100%_100%,0_100%)] hover:-translate-y-1 hover:shadow-[0_28px_54px_-30px_var(--shadow-color)] focus-within:-translate-y-1',
        isFailed ? 'border-danger/40' : 'border-border hover:border-border-strong',
        activity === 'deleting' && 'opacity-50',
      )}
      aria-label={document.name}
      aria-busy={isBusy || document.status === 'processing'}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0 right-0 size-11 rounded-bl-lg [clip-path:polygon(0_0,100%_100%,0_100%)]',
          isFailed ? 'bg-danger' : 'bg-accent',
        )}
      />

      {isWorking && !isStatic && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-24 [background:linear-gradient(transparent,color-mix(in_oklab,var(--accent)_35%,transparent),transparent)]"
          initial={{ top: '-30%' }}
          animate={{ top: '110%' }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}
        />
      )}

      <div className="relative flex items-center gap-3 pr-10">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-xl',
            isFailed ? 'bg-danger-soft text-danger' : 'bg-surface-muted text-text',
          )}
        >
          {isFailed ? <AlertTriangle className="size-4.5" /> : <FileText className="size-4.5" />}
        </span>
        <StatusMark
          status={status.mark}
          size={16}
          fontSize={12}
          label={status.label}
          strike={false}
          className="text-muted"
        />
      </div>

      <h3 className="relative mt-4 line-clamp-2 font-display text-lg leading-snug break-words" title={document.name}>
        {document.name.replace(/\.pdf$/i, '')}
      </h3>
      <p className="relative mt-1.5 font-label text-[11px] font-semibold tracking-wider text-subtle uppercase">
        {document.status === 'ready' ? `${pluralize(document.chunkCount, 'passage')} · ` : ''}
        {formatBytes(document.sizeBytes)} · {formatRelativeTime(document.uploadedAt)}
      </p>

      {isFailed && document.error && <p className="relative mt-3 text-sm leading-snug text-danger">{document.error}</p>}

      <div className="relative mt-auto flex items-center gap-2 pt-5 transition-opacity duration-200 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        {document.status === 'ready' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onAsk(document)}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <MessageSquareText className="size-4" />
            Ask about it
          </button>
        )}
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onDelete(document)}
          aria-label={`Delete ${document.name}`}
          className="ml-auto grid size-9 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  )
}

/** A placeholder card for a file whose upload request hasn't returned yet. */
export function UploadingCard({ name }: { name: string }) {
  return (
    <article
      aria-label={name}
      aria-busy="true"
      className="relative flex h-full min-h-56 flex-col overflow-hidden rounded-[1.4rem] border border-dashed border-border-strong bg-surface/70 p-5"
    >
      <StatusMark status="running" size={16} fontSize={12} label="Uploading" className="text-muted" />
      <h3 className="mt-4 line-clamp-2 font-display text-lg leading-snug break-words">{name.replace(/\.pdf$/i, '')}</h3>
      <div className="mt-auto flex flex-col gap-2 pt-5">
        {[88, 70, 54].map((width) => (
          <span key={width} className="h-1.5 animate-pulse rounded-full bg-border-strong" style={{ width: `${width}%` }} />
        ))}
      </div>
    </article>
  )
}
