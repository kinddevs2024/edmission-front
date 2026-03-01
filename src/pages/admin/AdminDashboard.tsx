import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { getAdminStats, getVerificationQueue } from '@/services/admin'
import type { AdminStats as AdminStatsType } from '@/services/admin'

export function AdminDashboard() {
  const { t } = useTranslation('admin')
  const [stats, setStats] = useState<AdminStatsType | null>(null)
  const [verificationCount, setVerificationCount] = useState(0)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setStats({
        studentsCount: 0,
        universitiesCount: 0,
        activeOffersCount: 0,
        healthStatus: 'ok',
      }))
  }, [])

  useEffect(() => {
    getVerificationQueue()
      .then((list) => setVerificationCount(list.length))
      .catch(() => setVerificationCount(0))
  }, [])

  const healthLabel = stats?.healthStatus === 'ok' ? t('healthOk') : stats?.healthStatus === 'degraded' ? t('healthDegraded') : t('healthError')
  const healthClass = stats?.healthStatus === 'ok' ? 'text-[#22C55E]' : stats?.healthStatus === 'degraded' ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="space-y-6">
      <PageTitle title={t('dashboard')} icon="LayoutDashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardTitle>{t('students')}</CardTitle>
          <p className="text-2xl font-semibold">{stats?.studentsCount ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>{t('universities')}</CardTitle>
          <p className="text-2xl font-semibold">{stats?.universitiesCount ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>{t('activeOffers')}</CardTitle>
          <p className="text-2xl font-semibold">{stats?.activeOffersCount ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>{t('systemHealth')}</CardTitle>
          <p className={`text-2xl font-semibold ${healthClass}`}>{healthLabel}</p>
        </Card>
      </div>

      {(stats?.mrr != null || (stats?.subscriptionsByPlan && Object.keys(stats.subscriptionsByPlan).length > 0)) && (
        <Card>
          <CardTitle>Subscriptions & MRR</CardTitle>
          <div className="flex flex-wrap gap-4 mt-2">
            {stats?.mrr != null && (
              <p className="text-xl font-semibold text-primary-accent">MRR: ${stats.mrr.toFixed(2)}</p>
            )}
            {stats?.subscriptionsByPlan && Object.entries(stats.subscriptionsByPlan).map(([plan, count]) => (
              <span key={plan} className="text-sm text-[var(--color-text-muted)]">
                {plan}: {count}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardTitle>{t('verificationQueue')}</CardTitle>
          <p className="text-[var(--color-text-muted)] mb-3">
            {t('verificationPending', { count: verificationCount })}
          </p>
          <Button to="/admin/verification" variant="secondary">{t('viewQueue')}</Button>
        </Card>
        <Card>
          <CardTitle>{t('quickLinks')}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button to="/admin/users" variant="secondary" size="sm">{t('users')}</Button>
            <Button to="/admin/logs" variant="secondary" size="sm">{t('auditLogs')}</Button>
            <Button to="/admin/health" variant="secondary" size="sm">{t('systemHealth')}</Button>
            <Button to="/admin/scholarships" variant="secondary" size="sm">{t('scholarships')}</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
