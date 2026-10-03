import { Check, type LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'

import { cn } from '@/lib/cn'

import type { ThemePreference } from '../preferences-store'

// Fixed palettes so each preview shows its own theme regardless of the one currently active
const PREVIEW_PALETTES: Record<'light' | 'dark', CSSProperties> = {
  light: {
    '--pv-bg': 'var(--brand-offwhite)',
    '--pv-surface': 'var(--brand-white)',
    '--pv-ink': 'var(--brand-teal)',
    '--pv-line': 'color-mix(in oklab, var(--brand-teal) 18%, transparent)',
    '--pv-primary': 'var(--brand-teal)',
  } as CSSProperties,
  dark: {
    '--pv-bg': 'color-mix(in oklab, var(--brand-teal) 72%, black)',
    '--pv-surface': 'var(--brand-teal)',
    '--pv-ink': 'var(--brand-offwhite)',
    '--pv-line': 'color-mix(in oklab, var(--brand-offwhite) 20%, transparent)',
    '--pv-primary': 'var(--brand-lime)',
  } as CSSProperties,
}

interface ThemeOptionProps {
  value: ThemePreference
  label: string
  description: string
  icon: LucideIcon
  checked: boolean
  onSelect: (value: ThemePreference) => void
}

/** A theme choice shown as a miniature of the app in that theme. A native radio keeps keyboard and screen readers working. */
export function ThemeOption({ value, label, description, icon: Icon, checked, onSelect }: ThemeOptionProps) {
  return (
    <label
      className={cn(
        'group relative flex cursor-pointer flex-col gap-4 rounded-card border bg-surface p-3 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]',
        checked
          ? 'border-primary shadow-[0_0_0_1px_var(--primary),0_20px_40px_-26px_var(--shadow-color)]'
          : 'border-border hover:border-border-strong',
      )}
    >
      <input
        type="radio"
        name="theme"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border">
        {value === 'system' ? (
          <>
            <AppPreview palette="light" />
            <div className="absolute inset-0 [clip-path:polygon(62%_0,100%_0,100%_100%,38%_100%)]">
              <AppPreview palette="dark" />
            </div>
          </>
        ) : (
          <AppPreview palette={value} />
        )}
        <span
          className={cn(
            'absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-primary text-on-primary shadow-md transition-[transform,opacity] duration-300',
            checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      </div>
      <div className="flex items-start gap-3 px-1 pb-1">
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl transition-colors',
            checked ? 'bg-accent text-on-accent' : 'bg-surface-muted text-text',
          )}
        >
          <Icon className="size-4" />
        </span>
        <span>
          <span className="block font-semibold">{label}</span>
          <span className="mt-0.5 block text-sm leading-snug text-muted">{description}</span>
        </span>
      </div>
    </label>
  )
}

/** A tiny, decorative mock of the AskPDF layout drawn with the given palette. */
function AppPreview({ palette }: { palette: 'light' | 'dark' }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex bg-[var(--pv-bg)]" style={PREVIEW_PALETTES[palette]}>
      <div className="flex w-[22%] flex-col gap-1.5 border-r border-[var(--pv-line)] bg-[var(--pv-surface)] p-2">
        <span className="mb-1 h-2.5 w-2.5 rounded-[3px] bg-[var(--pv-primary)]" />
        <span className="h-1 w-4/5 rounded-full bg-[var(--pv-line)]" />
        <span className="h-1 w-3/5 rounded-full bg-[var(--pv-line)]" />
      </div>
      <div className="flex flex-1 items-center gap-2 p-2.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="h-2 w-11/12 rounded-full bg-[var(--pv-ink)]" />
          <span className="flex items-center gap-1">
            <span className="h-2 w-1/4 rounded-full bg-[var(--pv-ink)]" />
            <span className="h-2.5 w-2/5 rounded-[3px] bg-brand-lime" />
          </span>
          <span className="mt-1 h-1 w-4/5 rounded-full bg-[var(--pv-line)]" />
          <span className="mt-1.5 h-3 w-full rounded-full border border-[var(--pv-line)] bg-[var(--pv-surface)]" />
        </div>
        <div className="relative h-[70%] w-[30%] rounded-md border border-[var(--pv-line)] bg-[var(--pv-surface)] [clip-path:polygon(0_0,70%_0,100%_22%,100%_100%,0_100%)]">
          <span className="absolute top-0 right-0 h-[22%] w-[30%] bg-brand-lime [clip-path:polygon(0_0,100%_100%,0_100%)]" />
          <span className="absolute top-[34%] left-[14%] h-0.5 w-3/5 rounded-full bg-[var(--pv-line)]" />
          <span className="absolute top-[48%] left-[14%] h-0.5 w-1/2 rounded-full bg-[var(--pv-line)]" />
          <span className="absolute top-[62%] left-[14%] h-0.5 w-2/5 rounded-full bg-[var(--pv-line)]" />
        </div>
      </div>
    </div>
  )
}
