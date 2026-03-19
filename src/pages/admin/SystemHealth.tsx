import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { getHealth } from '@/services/admin'
import type { ServiceHealth } from '@/services/admin'
import { toastApiError } from '@/utils/toastError'

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
        <CardTitle>{t('common:overview')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('common:loading', 'Loading...')}</p>
        ) : (
          <p className={`text-lg font-medium ${status === 'ok' ? 'text-[#22C55E]' : status === 'degraded' ? 'text-amber-500' : 'text-red-500'}`}>
            {t('common:status', 'Status')}: {status}
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>{t('admin:services')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('common:loading', 'Loading...')}</p>
        ) : services.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('admin:noServiceData')}</p>
        ) : (
          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.name} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                <span>{s.name}</span>
                <span className={s.status === 'up' ? 'text-[#22C55E]' : 'text-red-500'}>
                  {s.status === 'up' ? t('admin:serviceUp', 'Up') : t('admin:serviceDown', 'Down')}
                  {s.latency != null && ` (${s.latency}ms)`}
                </span>
                {s.message && <span className="text-sm text-[var(--color-text-muted)]">{s.message}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
