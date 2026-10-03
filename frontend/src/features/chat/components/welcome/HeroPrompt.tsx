import { ArrowUp, Sparkles } from 'lucide-react'
import type { FormEvent, KeyboardEvent, RefObject } from 'react'

import { cn } from '@/lib/cn'

import { MAX_QUESTION_LENGTH } from '../ChatComposer'
import { useTypewriter } from './use-typewriter'

interface HeroPromptProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (question: string) => void
  suggestions: string[]
  disabled: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
}

/** The welcome screen's main input. Its placeholder types out example questions; Tab accepts the one showing. */
export function HeroPrompt({ value, onChange, onSubmit, suggestions, disabled, inputRef }: HeroPromptProps) {
  const isEmpty = value.length === 0
  const { text: typedSuggestion, phrase: suggestion } = useTypewriter(suggestions, isEmpty && !disabled)
  const question = value.trim()
  const canSubmit = !disabled && question.length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canSubmit) onSubmit(question)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' && isEmpty && suggestion && !event.shiftKey) {
      event.preventDefault()
      onChange(suggestion)
    } else if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="group/prompt relative">
      <div
        aria-hidden="true"
        className="absolute -inset-1 rounded-[1.8rem] bg-accent opacity-0 blur-xl transition-opacity duration-500 group-focus-within/prompt:opacity-40 dark:group-focus-within/prompt:opacity-25"
      />
      <div className="relative flex items-end gap-3 rounded-[1.5rem] border border-border-strong bg-surface p-2.5 pl-5 shadow-[0_24px_60px_-30px_var(--shadow-color)] transition-colors group-focus-within/prompt:border-primary">
        <Sparkles className="mt-3.5 size-5 shrink-0 self-start text-subtle transition-colors group-focus-within/prompt:text-primary" />
        <label htmlFor="welcome-question" className="sr-only">
          Ask a question about your documents
        </label>
        <textarea
          id="welcome-question"
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Add a PDF first, then ask anything about it…' : typedSuggestion || ' '}
          maxLength={MAX_QUESTION_LENGTH}
          disabled={disabled}
          rows={1}
          className="max-h-40 min-h-12 flex-1 resize-none bg-transparent py-3 text-base leading-6 outline-none placeholder:text-subtle [field-sizing:content] focus-visible:outline-none disabled:cursor-not-allowed sm:text-[17px]"
        />
        {isEmpty && suggestion && !disabled && (
          <kbd className="mb-3 hidden h-6 shrink-0 items-center rounded-md border border-border-strong bg-surface-muted px-2 font-label text-[11px] font-semibold text-muted sm:inline-flex">
            Tab
          </kbd>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Send question"
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-2xl transition-all duration-200',
            canSubmit
              ? 'cursor-pointer bg-primary text-on-primary shadow-[0_10px_24px_-10px_var(--shadow-color)] hover:scale-105 active:scale-95'
              : 'bg-surface-muted text-subtle',
          )}
        >
          <ArrowUp className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </form>
  )
}
