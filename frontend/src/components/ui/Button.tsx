import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const variantClasses = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-border-strong bg-surface text-text hover:bg-surface-muted',
  ghost: 'text-muted hover:bg-surface-muted hover:text-text',
  danger: 'bg-danger text-white hover:opacity-90',
}

const sizeClasses = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  icon: 'size-9',
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof variantClasses
  size?: keyof typeof sizeClasses
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control font-semibold transition-[opacity,background-color,color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
