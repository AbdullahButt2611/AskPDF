import { Library, MessageSquareText, Settings2, type LucideIcon } from 'lucide-react'

export interface NavigationItem {
  to: string
  label: string
  icon: LucideIcon
  /** Where the item sits in the desktop sidebar */
  placement: 'top' | 'bottom'
}

export const navigationItems: NavigationItem[] = [
  { to: '/', label: 'Ask', icon: MessageSquareText, placement: 'top' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: Library, placement: 'bottom' },
  { to: '/settings', label: 'Settings', icon: Settings2, placement: 'bottom' },
]
