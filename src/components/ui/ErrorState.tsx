import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title,
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  const { t } = useTranslation('common')
  return (
    <div className={'flex flex-col items-center justify-center py-12 px-4 text-center ' + className} role="alert">
      <p className="text-lg font-medium text-red-500">{title ?? t('somethingWentWrong')}</p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-sm">{message ?? t('tryAgainContactSupport')}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {t('tryAgain')}
        </Button>
      )}
    </div>
  )
}
