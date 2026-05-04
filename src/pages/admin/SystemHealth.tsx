import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { getHealth } from '@/services/admin'
import type { ServiceHealth } from '@/services/admin'
import { toastApiError } from '@/utils/toastError'
import { cn } from '@/utils/cn'

export function SystemHealth() {
  const { t } = useTranslation(['admin', 'common'])
  const [status, setStatus] = useState<string>('')
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHealth()
      .then((res) => {
        setStatus(res.status ?? 'unknown')
        setServices(res.services ?? [])
      })
      .catch((e) => {
        toastApiError(e)
        setStatus('error')
        setServices([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:systemHealthTitle', 'System health')} icon="Activity" />

      <Card>
        <CardTitle>{t('admin:overview', 'Overview')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('common:loading', 'Loading...')}</p>
        ) : (
          <p
            className={cn(
              'inline-flex rounded-input border px-3 py-1.5 text-sm font-semibold',
              status === 'ok'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600'
                : status === 'degraded'
                  ? 'border-amber-500/25 bg-amber-500/10 text-amber-600'
                  : 'border-red-500/25 bg-red-500/10 text-red-600'
            )}
          >
            {t('common:status', 'Status')}: {status}
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>{t('admin:services', 'Services')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('common:loading', 'Loading...')}</p>
        ) : services.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('admin:noServiceData', 'No service data. Backend may not expose /admin/health.')}</p>
        ) : (
          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.name} className="grid gap-2 border-b border-[var(--color-border)] py-2 last:border-0 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <span className="font-medium">{s.name}</span>
                <span className={cn('text-sm font-semibold', s.status === 'up' ? 'text-emerald-600' : 'text-red-500')}>
                  {s.status === 'up' ? t('admin:serviceUp', 'Up') : t('admin:serviceDown', 'Down')}
                  {s.latency != null && ` (${s.latency}ms)`}
                </span>
                {s.message && <span className="text-sm text-[var(--color-text-muted)] sm:text-right">{s.message}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
