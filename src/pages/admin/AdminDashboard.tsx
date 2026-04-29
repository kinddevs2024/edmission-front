import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { getAdminStats, getVerificationQueue, getUniversityInterestAnalytics } from '@/services/admin'
import type { AdminStats as AdminStatsType, UniversityInterestAnalyticsItem } from '@/services/admin'
import { toastApiError } from '@/utils/toastError'

export function AdminDashboard() {
  const { t } = useTranslation('admin')
  const [stats, setStats] = useState<AdminStatsType | null>(null)
  const [verificationCount, setVerificationCount] = useState(0)
  const [universityInterests, setUniversityInterests] = useState<UniversityInterestAnalyticsItem[]>([])

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((e) => {
        toastApiError(e)
        setStats({
          studentsCount: 0,
          universitiesCount: 0,
          activeOffersCount: 0,
          pendingDocumentsCount: 0,
          healthStatus: 'ok',
        })
      })
  }, [])

  useEffect(() => {
    getVerificationQueue()
      .then((list) => setVerificationCount(list.length))
      .catch((e) => { toastApiError(e); setVerificationCount(0) })
  }, [])

  useEffect(() => {
    getUniversityInterestAnalytics(15)
      .then(setUniversityInterests)
      .catch((e) => { toastApiError(e); setUniversityInterests([]) })
  }, [])

  const healthLabel = stats?.healthStatus === 'ok' ? t('healthOk') : stats?.healthStatus === 'degraded' ? t('healthDegraded') : t('healthError')
  const healthClass = stats?.healthStatus === 'ok' ? 'text-[#22C55E]' : stats?.healthStatus === 'degraded' ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="space-y-6 pb-page-bottom-cta">
      <PageTitle title={t('dashboard')} icon="LayoutDashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link to="/admin/users">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
            <CardTitle>{t('students')}</CardTitle>
            <p className="text-2xl font-semibold">{stats?.studentsCount ?? 0}</p>
          </Card>
        </Link>
        <Link to="/admin/universities">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
            <CardTitle>{t('universities')}</CardTitle>
            <p className="text-2xl font-semibold">{stats?.universitiesCount ?? 0}</p>
          </Card>
        </Link>
        <Link to="/admin/offers">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
            <CardTitle>{t('activeOffers')}</CardTitle>
            <p className="text-2xl font-semibold">{stats?.activeOffersCount ?? 0}</p>
          </Card>
        </Link>
        <Link to="/admin/documents">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
            <CardTitle>{t('pendingDocuments', 'Unverified files')}</CardTitle>
            <p className="text-2xl font-semibold">{stats?.pendingDocumentsCount ?? 0}</p>
          </Card>
        </Link>
        <Link to="/admin/health">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
            <CardTitle>{t('systemHealth')}</CardTitle>
            <p className={`text-2xl font-semibold ${healthClass}`}>{healthLabel}</p>
          </Card>
        </Link>
      </div>

      <Card>
        <CardTitle>{t('universitiesByStudentInterest', 'Universities by student interest')}</CardTitle>
        {universityInterests.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] mt-2">{t('noDataYet', 'No data yet.')}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">#</th>
                  <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">{t('universityProfile', 'University')}</th>
                  <th className="text-right py-2 font-medium text-[var(--color-text-muted)]">{t('interests')}</th>
                </tr>
              </thead>
              <tbody>
                {universityInterests.map((row, i) => (
                  <tr key={`${row.source}-${row.universityId}`} className="border-b border-[var(--color-border)]/50">
                    <td className="py-2 text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="py-2">
                      <span className="font-medium">{row.universityName}</span>
                      {row.source === 'catalog' && (
                        <span className="ml-1.5 text-xs text-[var(--color-text-muted)]">(catalog)</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-medium">{row.interestCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
        <Link to="/admin/verification">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
            <CardTitle>{t('verificationQueue')}</CardTitle>
            <p className="text-[var(--color-text-muted)] mb-3">
              {t('verificationPending', { count: verificationCount })}
            </p>
            <span className="inline-block px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)] text-[var(--color-text-muted)]">
              {t('viewQueue')}
            </span>
          </Card>
        </Link>
        <Card>
          <CardTitle>{t('quickLinks')}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button to="/admin/users" variant="secondary" size="sm">{t('users')}</Button>
            <Button to="/admin/verification" variant="secondary" size="sm">Universities (verify)</Button>
            <Button to="/admin/support" variant="secondary" size="sm">Support</Button>
            <Button to="/admin/logs" variant="secondary" size="sm">{t('auditLogs')}</Button>
            <Button to="/admin/health" variant="secondary" size="sm">{t('systemHealth')}</Button>
            <Button to="/admin/scholarships" variant="secondary" size="sm">{t('scholarships')}</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
