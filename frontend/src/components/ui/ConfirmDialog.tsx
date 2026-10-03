import * as AlertDialog from '@radix-ui/react-alert-dialog'
import type { ReactNode } from 'react'

import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'primary' | 'danger'
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-brand-teal/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_160ms_ease-out]" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-1/2 rounded-card border border-border bg-surface p-6 shadow-[0_24px_64px_-16px_var(--shadow-color)] data-[state=open]:animate-[dialog-in_200ms_cubic-bezier(0.23,1,0.32,1)]">
          <AlertDialog.Title className="font-display text-xl">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-2 text-sm leading-relaxed text-muted">{description}</div>
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant={tone} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
