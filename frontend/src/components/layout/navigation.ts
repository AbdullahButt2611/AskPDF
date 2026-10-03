import { Library, MessageSquareText, Settings2, type LucideIcon } from 'lucide-react'

export interface NavigationItem {
  to: string
  label: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { to: '/', label: 'Ask', icon: MessageSquareText },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: Library },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]
