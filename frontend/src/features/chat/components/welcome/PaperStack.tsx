import { CloudUpload, Layers, Quote } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'

import type { KnowledgeDocument } from '@/features/documents/api'
import { cn } from '@/lib/cn'
import { formatBytes, pluralize } from '@/lib/format'

const STACK_DEPTH = 3
const MAX_TILT_DEGREES = 10
// Widths of the skeleton text lines on each page, as percentages
const LINE_WIDTHS = [92, 78, 86, 64, 90, 72, 83, 58, 88, 70]
const SPRING = 'cubic-bezier(0.34, 1.4, 0.64, 1)'

interface PaperStackProps {
  documents: KnowledgeDocument[]
  onPick: (document: KnowledgeDocument) => void
  onUpload: () => void
}

/** The user's documents as a stack of pages that tilts with the cursor, fans out on hover and gets "read" by a scan beam. */
export function PaperStack({ documents, onPick, onUpload }: PaperStackProps) {
  const isStatic = useReducedMotion() ?? false
  const passageCount = documents.reduce((total, document) => total + document.chunkCount, 0)

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    if (isStatic) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    event.currentTarget.style.setProperty('--stack-rx', `${-y * MAX_TILT_DEGREES}deg`)
    event.currentTarget.style.setProperty('--stack-ry', `${x * MAX_TILT_DEGREES}deg`)
  }
  const resetTilt = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--stack-rx', '0deg')
    event.currentTarget.style.setProperty('--stack-ry', '0deg')
  }

  if (documents.length === 0) {
    return (
      <div className="relative mx-auto grid h-[22rem] w-full max-w-sm place-items-center sm:h-[28rem]">
        <button
          type="button"
          onClick={onUpload}
          className="group flex aspect-[3/4] w-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-[1.4rem] border-2 border-dashed border-border-strong bg-surface/60 p-6 text-center backdrop-blur transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:rotate-[-2deg] hover:border-primary sm:w-64"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-primary text-on-primary transition-transform duration-300 group-hover:-rotate-6">
            <CloudUpload className="size-6" />
          </span>
          <span className="font-display text-lg leading-tight">Drop a PDF Here</span>
          <span className="text-sm text-muted">or click to browse</span>
        </button>
      </div>
    )
  }

  const pages = Array.from({ length: STACK_DEPTH }, (_, depth) => documents[depth] ?? null)

  return (
    <div
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      className="group/stack relative mx-auto h-[22rem] w-full max-w-md [perspective:1100px] sm:h-[28rem]"
    >
      <div className="absolute inset-0 transition-transform duration-500 ease-out [transform-style:preserve-3d] [transform:rotateX(var(--stack-rx,0deg))_rotateY(var(--stack-ry,0deg))]">
        {pages
          .map((document, depth) => ({ document, depth }))
          .reverse()
          .map(({ document, depth }) => (
            <Page
              key={document?.name ?? `blank-${depth}`}
              document={document}
              depth={depth}
              animate={!isStatic && depth === 0}
              onPick={onPick}
            />
          ))}
      </div>

      <FloatingBadge className="top-[6%] right-[-2%] sm:right-[-6%]" delay={0} isStatic={isStatic}>
        <Layers className="size-3.5" />
        {pluralize(passageCount, 'passage')} indexed
      </FloatingBadge>
      <FloatingBadge className="bottom-[1%] left-[-2%] sm:left-[-10%]" delay={1.2} isStatic={isStatic}>
        <Quote className="size-3.5" />
        Answers cite their sources
      </FloatingBadge>
    </div>
  )
}

interface PageProps {
  document: KnowledgeDocument | null
  depth: number
  animate: boolean
  onPick: (document: KnowledgeDocument) => void
}

function Page({ document, depth, animate, onPick }: PageProps) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="absolute top-0 right-0 size-12 rounded-bl-xl bg-accent [clip-path:polygon(0_0,100%_100%,0_100%)]"
      />
      <span className="relative flex h-full flex-col p-6">
        {document ? (
          <>
            <span className="line-clamp-2 pr-10 font-display text-lg leading-snug">
              {document.name.replace(/\.pdf$/i, '')}
            </span>
            <span className="mt-2 font-label text-[11px] font-semibold tracking-wider text-subtle uppercase">
              {pluralize(document.chunkCount, 'passage')} · {formatBytes(document.sizeBytes)}
            </span>
          </>
        ) : (
          <span className="h-4 w-1/2 rounded-full bg-border-strong" />
        )}
        <span className="mt-6 flex flex-col gap-2.5">
          {LINE_WIDTHS.map((width, index) => (
            <span key={index} className="h-1.5 rounded-full bg-border-strong" style={{ width: `${width}%` }} />
          ))}
        </span>
        {document && (
          <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary opacity-0 transition-opacity duration-300 group-hover/page:opacity-100">
            Summarize this →
          </span>
        )}
      </span>
      {animate && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-20 [background:linear-gradient(transparent,color-mix(in_oklab,var(--accent)_55%,transparent),transparent)]"
          initial={{ top: '-25%' }}
          animate={{ top: '110%' }}
          transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
        />
      )}
    </>
  )

  const className = cn(
    'group/page absolute top-1/2 left-1/2 aspect-[3/4] w-56 overflow-hidden rounded-[1.4rem] border border-border bg-surface text-left shadow-[0_30px_60px_-30px_var(--shadow-color)] sm:w-64',
    '[clip-path:polygon(0_0,calc(100%-3rem)_0,100%_3rem,100%_100%,0_100%)]',
    '[transform:translate(-50%,-50%)_translate(calc(var(--depth)*-16px),calc(var(--depth)*12px))_rotate(calc(var(--depth)*-5deg))]',
    'group-hover/stack:[transform:translate(-50%,-50%)_translate(calc(var(--depth)*-58px),calc(var(--depth)*6px))_rotate(calc(var(--depth)*-12deg))]',
    // Pages further back get a tinted fill and stronger edge so the stack reads clearly on light backgrounds
    depth > 0 && 'border-border-strong bg-surface-muted',
  )
  const style = {
    '--depth': depth,
    zIndex: 10 - depth,
    transition: `transform 600ms ${SPRING}, box-shadow 300ms ease`,
  } as CSSProperties

  return document ? (
    <button
      type="button"
      onClick={() => onPick(document)}
      className={cn(className, 'cursor-pointer hover:shadow-[0_36px_70px_-28px_var(--shadow-color)] focus-visible:outline-2')}
      style={style}
      aria-label={`Ask for a summary of ${document.name}`}
    >
      {content}
    </button>
  ) : (
    <div aria-hidden="true" className={className} style={style}>
      {content}
    </div>
  )
}

function FloatingBadge({
  className,
  delay,
  isStatic,
  children,
}: {
  className: string
  delay: number
  isStatic: boolean
  children: ReactNode
}) {
  return (
    <motion.span
      className={cn(
        'absolute z-20 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-2 font-label text-[11px] font-semibold tracking-wide text-text shadow-[0_16px_36px_-20px_var(--shadow-color)] backdrop-blur-md',
        className,
      )}
      animate={isStatic ? undefined : { y: [0, -8, 0] }}
      transition={{ duration: 4.2, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.span>
  )
}
