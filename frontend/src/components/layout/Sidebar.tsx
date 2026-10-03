import { motion } from 'motion/react'
import { Link, NavLink } from 'react-router'

import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/cn'

import { navigationItems, type NavigationItem } from './navigation'

export function Sidebar() {
  const topItems = navigationItems.filter((item) => item.placement === 'top')
  const bottomItems = navigationItems.filter((item) => item.placement === 'bottom')

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <Link to="/" className="mb-10 px-2" aria-label="AskPDF home">
        <Logo className="h-9" />
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col">
        <ul className="flex flex-col gap-1">
          {topItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </ul>
        <ul className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
          {bottomItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </ul>
      </nav>
    </aside>
  )
}

function SidebarLink({ item: { to, label, icon: Icon } }: { item: NavigationItem }) {
  return (
    <li>
      <NavLink
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
    </li>
  )
}
