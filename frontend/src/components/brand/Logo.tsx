import LogoDark from '@/assets/logo/askpdf-logo-dark-mode.svg?react'
import LogoLight from '@/assets/logo/askpdf-logo-light-mode.svg?react'
import MarkDark from '@/assets/logo/askpdf-mark-dark-mode.svg?react'
import MarkLight from '@/assets/logo/askpdf-mark-light-mode.svg?react'
import { cn } from '@/lib/cn'

interface LogoProps {
  variant?: 'full' | 'mark'
  className?: string
}

/**
 * Renders both theme variants and lets CSS pick one, so the logo is correct on the very first paint.
 * The SVGs are inlined (not <img>) so the wordmark's live text uses the app's Bricolage Grotesque font.
 */
export function Logo({ variant = 'full', className }: LogoProps) {
  const [Light, Dark] = variant === 'full' ? [LogoLight, LogoDark] : [MarkLight, MarkDark]
  return (
    <span className={cn('inline-flex', className)} role="img" aria-label="AskPDF">
      <Light aria-hidden className="h-full w-auto dark:hidden" />
      <Dark aria-hidden className="hidden h-full w-auto dark:block" />
    </span>
  )
}
