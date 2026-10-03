import { Link, NavLink } from 'react-router'

import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/cn'

import { navigationItems } from './navigation'

export function MobileHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
      <Link to="/" aria-label="AskPDF home">
        <Logo className="h-7" />
      </Link>
      <nav aria-label="Main" className="flex gap-1">
        {navigationItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'grid size-10 place-items-center rounded-control transition-colors',
                isActive ? 'bg-primary text-on-primary' : 'text-muted hover:bg-surface-muted',
              )
            }
          >
            <Icon className="size-5" />
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
