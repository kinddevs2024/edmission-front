import { type ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionTo?: string
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  icon,
  className = '',
}: EmptyStateProps) {
  const iconNode = icon ?? <Inbox className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" aria-hidden />
  return (
    <div
      className={'flex flex-col items-center justify-center py-12 px-4 text-center ' + className}
      role="status"
      aria-label={'Empty: ' + title}
    >
      <div className="mb-4">{iconNode}</div>
      <h3 className="text-lg font-medium text-[var(--color-text)]">{title}</h3>
      {description && <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>}
      {(actionLabel && (onAction || actionTo)) && (
        <div className="mt-4">
          {actionTo ? <Button to={actionTo}>{actionLabel}</Button> : <Button onClick={onAction}>{actionLabel}</Button>}
        </div>
      )}
    </div>
  )
}
