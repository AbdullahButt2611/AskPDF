import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-label font-semibold text-xs tracking-wider text-subtle uppercase">{eyebrow}</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-muted">{description}</p>
      </div>
      {actions}
    </header>
  )
}
