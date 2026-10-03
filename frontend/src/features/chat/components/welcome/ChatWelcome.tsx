import { CalendarDays, Lightbulb, ListChecks, Search, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'

import { AmbientBackground } from '@/components/brand/AmbientBackground'
import type { KnowledgeDocument } from '@/features/documents/api'
import { usePdfDropzone } from '@/features/documents/use-pdf-dropzone'
import { pluralize } from '@/lib/format'

import { DropOverlay } from './DropOverlay'
import { HeroPrompt } from './HeroPrompt'
import { Highlight } from './Highlight'
import { PaperStack } from './PaperStack'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

interface QuickAction {
  label: string
  icon: LucideIcon
  template: string
}

function greeting(hour = new Date().getHours()) {
  if (hour < 5) return 'Working late'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function displayName(document: KnowledgeDocument) {
  return document.name.replace(/\.pdf$/i, '')
}

function buildQuickActions(documents: KnowledgeDocument[]): QuickAction[] {
  const subject = documents.length === 1 ? `"${displayName(documents[0])}"` : 'my documents'
  return [
    { label: 'Summarize', icon: ListChecks, template: `Summarize ${subject} in five bullet points` },
    { label: 'Key dates', icon: CalendarDays, template: 'List every important date and what happened on it' },
    { label: 'Explain simply', icon: Lightbulb, template: 'Explain the main ideas as if I were new to the topic' },
    // Left open on purpose: the user finishes the sentence
    { label: 'Find…', icon: Search, template: 'Where do my documents mention ' },
  ]
}

function buildSuggestions(documents: KnowledgeDocument[]) {
  const first = documents[0] ? displayName(documents[0]) : 'this document'
  return [
    `What is "${first}" mainly about?`,
    'Which dates or deadlines are mentioned?',
    'What are the most important numbers in here?',
    'Explain the key ideas in simple terms',
  ]
}

interface ChatWelcomeProps {
  readyDocuments: KnowledgeDocument[]
  onAsk: (question: string) => void
}

export function ChatWelcome({ readyDocuments, onAsk }: ChatWelcomeProps) {
  const isStatic = useReducedMotion() ?? false
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { getRootProps, getInputProps, isDragActive, open, replaceDialog } = usePdfDropzone({
    noClick: true,
    noKeyboard: true,
  })

  const hasDocuments = readyDocuments.length > 0

  const prefill = (text: string) => {
    setDraft(text)
    requestAnimationFrame(() => {
      const input = inputRef.current
      input?.focus()
      input?.setSelectionRange(text.length, text.length)
    })
  }

  const container: Variants = { hidden: {}, visible: { transition: { staggerChildren: isStatic ? 0 : 0.09 } } }
  const rise: Variants = {
    hidden: isStatic ? { opacity: 0 } : { opacity: 0, y: 22, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE_OUT } },
  }

  return (
    <div {...getRootProps({ className: 'relative isolate h-full overflow-y-auto outline-none' })}>
      <input {...getInputProps()} />
      <AmbientBackground />
      <DropOverlay visible={isDragActive} />

      <section className="mx-auto grid min-h-full w-full max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 xl:gap-24">
        <motion.div variants={container} initial="hidden" animate="visible" className="@container relative">
          <motion.p
            variants={rise}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 font-label text-[11px] font-semibold tracking-[0.14em] text-subtle uppercase"
          >
            <span>{greeting()}</span>
            <Link to="/knowledge-base" className="group inline-flex items-center gap-2 transition-colors hover:text-text">
              <span className="relative flex size-2">
                {hasDocuments && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                )}
                <span className={`relative inline-flex size-2 rounded-full ${hasDocuments ? 'bg-success' : 'bg-subtle'}`} />
              </span>
              {hasDocuments ? `${pluralize(readyDocuments.length, 'document')} ready` : 'No documents yet'}
            </Link>
          </motion.p>

          <motion.h1
            variants={rise}
            className="mt-5 font-display text-[clamp(2.5rem,12cqi,5.4rem)] leading-[0.98] tracking-[-0.035em]"
          >
            {hasDocuments ? (
              <>
                <span className="block whitespace-nowrap">Your Pages Hold</span>
                <span className="block whitespace-nowrap">
                  the <Highlight delay={isStatic ? 0 : 0.85}>Answers.</Highlight>
                </span>
              </>
            ) : (
              <>
                <span className="block whitespace-nowrap">Let&apos;s Start</span>
                <span className="block whitespace-nowrap">
                  <Highlight delay={isStatic ? 0 : 0.85}>Reading.</Highlight>
                </span>
              </>
            )}
          </motion.h1>

          <motion.p variants={rise} className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            {hasDocuments
              ? 'Ask about anything in your documents. Every answer comes straight from your pages, with the sources to prove it.'
              : 'Drop a PDF anywhere on this page to add it. Then ask about it in plain language and get answers straight from its pages.'}
          </motion.p>

          <motion.div variants={rise} className="mt-8">
            <HeroPrompt
              value={draft}
              onChange={setDraft}
              onSubmit={onAsk}
              suggestions={buildSuggestions(readyDocuments)}
              disabled={!hasDocuments}
              inputRef={inputRef}
            />
          </motion.div>

          {hasDocuments && (
            <motion.ul variants={rise} className="mt-4 flex flex-wrap gap-2" aria-label="Quick starts">
              {buildQuickActions(readyDocuments).map(({ label, icon: Icon, template }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => prefill(template)}
                    className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-2 text-sm font-medium backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-surface active:translate-y-0"
                  >
                    <Icon className="size-4 text-subtle transition-colors group-hover:text-primary" />
                    {label}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}

          <motion.p
            variants={rise}
            className="mt-6 hidden font-label text-[11px] font-semibold tracking-wider text-subtle uppercase sm:block"
          >
            Tip · drop a PDF anywhere on this page to add it
          </motion.p>
        </motion.div>

        <motion.div
          initial={isStatic ? { opacity: 0 } : { opacity: 0, x: 40, rotate: 4 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.9, delay: isStatic ? 0 : 0.25, ease: EASE_OUT }}
        >
          <PaperStack
            documents={readyDocuments}
            onPick={(document) => prefill(`Summarize "${displayName(document)}" in five bullet points`)}
            onUpload={open}
          />
        </motion.div>
      </section>

      {replaceDialog}
    </div>
  )
}
