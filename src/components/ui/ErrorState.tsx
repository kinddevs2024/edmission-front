import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again or contact support.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={'flex flex-col items-center justify-center py-12 px-4 text-center ' + className} role="alert">
      <p className="text-lg font-medium text-red-500">{title}</p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
