import { ArrowUp } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'

import { cn } from '@/lib/cn'

interface ChatComposerProps {
  onSubmit: (question: string) => void
  disabled: boolean
  placeholder: string
}

const MAX_QUESTION_LENGTH = 2000

export function ChatComposer({ onSubmit, disabled, placeholder }: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const question = draft.trim()
  const canSubmit = !disabled && question.length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit(question)
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
      <div className="flex items-end gap-2 rounded-[1.5rem] border border-border-strong bg-surface p-2 pl-5 shadow-[0_12px_40px_-20px_var(--shadow-color)] transition-colors focus-within:border-primary">
        <label htmlFor="question" className="sr-only">
          Your question
        </label>
        <textarea
          id="question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={MAX_QUESTION_LENGTH}
          rows={1}
          className="max-h-48 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 outline-none placeholder:text-subtle [field-sizing:content] focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Send question"
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full transition-all duration-200',
            canSubmit
              ? 'cursor-pointer bg-primary text-on-primary hover:scale-105 active:scale-95'
              : 'bg-surface-muted text-subtle',
          )}
        >
          <ArrowUp className="size-5" strokeWidth={2.5} />
        </button>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] tracking-wider text-subtle uppercase">
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  )
}
