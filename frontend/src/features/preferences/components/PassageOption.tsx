import { cn } from '@/lib/cn'

import { PASSAGE_COUNT_OPTIONS, type PassageCount } from '../preferences-store'

const MAX_PASSAGES = PASSAGE_COUNT_OPTIONS[PASSAGE_COUNT_OPTIONS.length - 1]

interface PassageOptionProps {
  value: PassageCount
  label: string
  description: string
  recommended?: boolean
  checked: boolean
  onSelect: (value: PassageCount) => void
}

/** One "passages per answer" choice, with a stack of page bars that shows how much each answer reads. */
export function PassageOption({ value, label, description, recommended, checked, onSelect }: PassageOptionProps) {
  return (
    <label
      className={cn(
        'group relative flex cursor-pointer flex-col rounded-card border bg-surface p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]',
        checked
          ? 'border-primary shadow-[0_0_0_1px_var(--primary),0_20px_40px_-26px_var(--shadow-color)]'
          : 'border-border hover:border-border-strong',
      )}
    >
      <input
        type="radio"
        name="passages"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span className="flex items-start justify-between gap-2">
        <span className="font-display text-4xl tabular-nums">{value}</span>
        {recommended && (
          <span className="rounded-full bg-accent px-2 py-0.5 font-label text-[10px] font-semibold tracking-wider text-on-accent uppercase">
            Recommended
          </span>
        )}
      </span>
      <span aria-hidden="true" className="mt-3 flex h-6 items-end gap-[3px]">
        {Array.from({ length: MAX_PASSAGES }, (_, index) => (
          <span
            key={index}
            className={cn(
              'w-1.5 rounded-sm transition-[height,background-color] duration-300',
              index < value
                ? checked
                  ? 'h-6 bg-primary dark:bg-accent'
                  : 'h-5 bg-border-strong group-hover:h-6'
                : 'h-2 bg-border',
            )}
          />
        ))}
      </span>
      <span className="mt-4 font-semibold">{label}</span>
      <span className="mt-1 text-sm leading-snug text-muted">{description}</span>
    </label>
  )
}
