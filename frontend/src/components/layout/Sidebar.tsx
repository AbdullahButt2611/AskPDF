import { motion } from 'motion/react'
import { Link, NavLink } from 'react-router'

import { Logo } from '@/components/brand/Logo'
import StatusMark from '@/components/reactbits/StatusMark'
import { useDocuments } from '@/features/documents/queries'
import { cn } from '@/lib/cn'
import { pluralize } from '@/lib/format'

import { navigationItems } from './navigation'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <Link to="/" className="mb-10 px-2" aria-label="AskPDF home">
        <Logo className="h-9" />
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {navigationItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'text-text' : 'text-muted hover:text-text',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-item"
                    className="absolute inset-0 rounded-control bg-surface-muted"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  >
                    <span className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-primary dark:bg-accent" />
                  </motion.span>
                )}
                <Icon className="relative size-4.5" strokeWidth={2} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <KnowledgeBaseSummary />
    </aside>
  )
}

function KnowledgeBaseSummary() {
  const { data: documents = [] } = useDocuments()
  const processingCount = documents.filter((document) => document.status === 'processing').length
  const readyCount = documents.filter((document) => document.status === 'ready').length

  return (
    <Link
      to="/knowledge-base"
      className="mt-auto rounded-card border border-border bg-surface-muted p-4 transition-colors hover:border-border-strong"
    >
      <p className="font-mono text-[11px] tracking-wider text-subtle uppercase">Knowledge base</p>
      <p className="mt-1.5 font-display text-2xl">{pluralize(readyCount, 'document')}</p>
      <p className="mt-0.5 text-xs text-muted">ready to answer from</p>
      {processingCount > 0 && (
        <StatusMark
          status="running"
          size={14}
          fontSize={12}
          label={`${processingCount} processing`}
          className="mt-3 text-muted"
        />
      )}
    </Link>
  )
}
