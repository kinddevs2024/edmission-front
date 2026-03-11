import { useTranslation } from 'react-i18next'

export function Maintenance() {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">
          {t('maintenance.title')}
        </h1>
        <p className="text-[var(--color-text-muted)]">
          {t('maintenance.description')}
        </p>
      </div>
    </div>
  )
}
