import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-border)] text-[var(--color-text)]',
  success: 'bg-status-accepted/20 text-status-accepted',
  warning: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  error: 'bg-red-500/20 text-red-600 dark:text-red-400',
  info: 'bg-status-under-review/20 text-status-under-review',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
