import { ArrowRight, Library } from 'lucide-react'
import { Link } from 'react-router'

import { Logo } from '@/components/brand/Logo'
import BlurText from '@/components/reactbits/BlurText'
import ShinyText from '@/components/reactbits/ShinyText'

const SUGGESTED_QUESTIONS = [
  'Summarize the key points of my documents',
  'What are the main conclusions or recommendations?',
  'List any dates, deadlines or numbers mentioned',
]

interface ChatWelcomeProps {
  hasReadyDocuments: boolean
  onAsk: (question: string) => void
}

export function ChatWelcome({ hasReadyDocuments, onAsk }: ChatWelcomeProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-12 text-center">
      <Logo variant="mark" className="h-16" />
      <BlurText
        text="Ask anything about your documents"
        delay={90}
        className="mt-6 justify-center font-display text-3xl leading-tight tracking-tight sm:text-5xl"
      />
      <ShinyText
        text="Answers come only from your files, with their sources listed."
        speed={3}
        className="mt-3 text-base sm:text-lg"
      />

      {hasReadyDocuments ? (
        <ul className="mt-10 grid w-full gap-3 sm:grid-cols-3">
          {SUGGESTED_QUESTIONS.map((question) => (
            <li key={question}>
              <button
                type="button"
                onClick={() => onAsk(question)}
                className="group flex h-full w-full cursor-pointer flex-col justify-between gap-4 rounded-card border border-border bg-surface p-4 text-left text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_12px_32px_-18px_var(--shadow-color)]"
              >
                {question}
                <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-text" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Link
          to="/knowledge-base"
          className="group mt-10 flex w-full max-w-md items-center gap-4 rounded-card border border-border bg-surface p-5 text-left transition-colors hover:border-primary"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
            <Library className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-display text-lg">Add your first PDF</span>
            <span className="block text-sm text-muted">Upload documents to your knowledge base to start asking.</span>
          </span>
          <ArrowRight className="size-5 text-subtle transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
