import { AlertCircle, FileText, RotateCw } from 'lucide-react'
import { motion } from 'motion/react'
import Markdown from 'react-markdown'

import { Logo } from '@/components/brand/Logo'
import { ReadingMark } from '@/components/brand/ReadingMark'
import ThoughtLine from '@/components/reactbits/ThoughtLine'
import { Button } from '@/components/ui/Button'
import { useDocuments } from '@/features/documents/queries'
import { pluralize } from '@/lib/format'

import type { Answer } from '../api'
import type { AssistantMessage as AssistantMessageData } from '../chat-store'
import { useThinkingSteps } from '../use-thinking-steps'
import { markdownComponents } from './markdown-components'

interface AssistantMessageProps {
  message: AssistantMessageData
  onRetry: (answerId: string, question: string) => void
}

export function AssistantMessage({ message, onRetry }: AssistantMessageProps) {
  const { data: documents = [] } = useDocuments()
  const readyCount = documents.filter((document) => document.status === 'ready').length

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="mt-0.5 grid size-10 shrink-0 place-items-center">
        {message.status === 'pending' ? <ReadingMark className="h-10 w-auto" /> : <Logo variant="mark" className="h-8" />}
      </div>

      <div className="min-w-0 flex-1 pt-1.5">
        {message.status !== 'failed' && <ThinkingTrace message={message} documentCount={readyCount} />}
        {message.status === 'answered' && <AnswerBody answer={message.answer} />}
        {message.status === 'failed' && (
          <div className="flex flex-col items-start gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center">
            <AlertCircle className="size-5 shrink-0 text-danger" />
            <p className="flex-1 text-sm">{message.error}</p>
            <Button variant="secondary" size="sm" onClick={() => onRetry(message.id, message.question)}>
              <RotateCw className="size-3.5" />
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/** One ThoughtLine for the whole lifecycle, so it visibly settles into "Answered in Xs" when the answer lands. */
function ThinkingTrace({ message, documentCount }: { message: AssistantMessageData; documentCount: number }) {
  const isPending = message.status === 'pending'
  // A start time of 0 reveals every step at once, which is what a finished answer's trace shows
  const steps = useThinkingSteps(isPending ? message.startedAt : 0, documentCount)

  return (
    <ThoughtLine
      label="Working through your documents"
      doneLabel="Answered in"
      working={isPending}
      elapsed={message.status === 'answered' ? message.thinkingSeconds : undefined}
      steps={steps}
      fontSize={14}
      color={isPending ? 'var(--text)' : 'var(--text-muted)'}
      glyphColor="var(--primary)"
    />
  )
}

function AnswerBody({ answer }: { answer: Answer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="mt-3"
    >
      <div className="leading-relaxed">
        <Markdown components={markdownComponents}>{answer.answer}</Markdown>
      </div>

      {answer.sources.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="font-label font-semibold text-[11px] tracking-wider text-subtle uppercase">
            Sources · {pluralize(answer.passageCount, 'passage')}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {answer.sources.map((source) => (
              <li
                key={source}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 font-label text-xs"
              >
                <FileText className="size-3.5 shrink-0 text-subtle" />
                <span className="truncate">{source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
