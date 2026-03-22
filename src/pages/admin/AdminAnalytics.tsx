import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { DateInput } from '@/components/ui/DateInput'
import { PageTitle } from '@/components/ui/PageTitle'
import { getAdminAnalyticsOverview, type AdminAnalyticsOverview } from '@/services/admin'
import { toastApiError } from '@/utils/toastError'
import { formatNumber } from '@/utils/format'
import { useTranslation } from 'react-i18next'

type RangePreset = 'today' | 'week' | 'month' | 'custom'

function toLocalDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildPresetRange(preset: Exclude<RangePreset, 'custom'>) {
  const now = new Date()
  const today = toLocalDateValue(now)
  if (preset === 'today') {
    return { from: today, to: today }
  }
  if (preset === 'week') {
    return { from: toLocalDateValue(shiftDays(now, -6)), to: today }
  }
  return { from: toLocalDateValue(startOfMonth(now)), to: today }
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </Card>
  )
}

export function AdminAnalytics() {
  const { t, i18n } = useTranslation(['admin', 'common'])
  const initialRange = buildPresetRange('today')
  const [preset, setPreset] = useState<RangePreset>('today')
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminAnalyticsOverview | null>(null)

  useEffect(() => {
    if (!from || !to) return
    setLoading(true)
    getAdminAnalyticsOverview({ from, to })
      .then(setStats)
      .catch((e) => {
        toastApiError(e)
        setStats({
          from,
          to,
          totalVisitors: 0,
          universityVisitors: 0,
          studentVisitors: 0,
          registrations: 0,
        })
      })
      .finally(() => setLoading(false))
  }, [from, to])

  const applyPreset = (nextPreset: Exclude<RangePreset, 'custom'>) => {
    const range = buildPresetRange(nextPreset)
    setPreset(nextPreset)
    setFrom(range.from)
    setTo(range.to)
  }

  const handleFromChange = (value: string) => {
    setPreset('custom')
    setFrom(value)
    if (to && value > to) setTo(value)
  }

  const handleToChange = (value: string) => {
    setPreset('custom')
    setTo(value)
    if (from && value < from) setFrom(value)
  }

  const locale = i18n.language || 'en'
  const totalVisitors = formatNumber(stats?.totalVisitors ?? 0, locale)
  const universityVisitors = formatNumber(stats?.universityVisitors ?? 0, locale)
  const studentVisitors = formatNumber(stats?.studentVisitors ?? 0, locale)
  const registrations = formatNumber(stats?.registrations ?? 0, locale)

  return (
    <div className="space-y-6">
      <PageTitle title={t('admin:analytics', 'Analytics')} icon="BarChart3" />

      <Card>
        <CardTitle>{t('admin:analyticsRangeTitle', 'Analytics period')}</CardTitle>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={preset === 'today' ? 'primary' : 'secondary'} size="sm" onClick={() => applyPreset('today')}>
            {t('admin:analyticsToday', 'Today')}
          </Button>
          <Button variant={preset === 'week' ? 'primary' : 'secondary'} size="sm" onClick={() => applyPreset('week')}>
            {t('admin:analyticsLast7Days', 'Last 7 days')}
          </Button>
          <Button variant={preset === 'month' ? 'primary' : 'secondary'} size="sm" onClick={() => applyPreset('month')}>
            {t('admin:analyticsLast30Days', 'Last 30 days')}
          </Button>
          <Button variant={preset === 'custom' ? 'primary' : 'secondary'} size="sm" onClick={() => setPreset('custom')}>
            {t('admin:analyticsCustomRange', 'Custom')}
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <DateInput
            label={t('admin:analyticsFrom', 'From')}
            value={from}
            max={to || undefined}
            onChange={(e) => handleFromChange(e.target.value)}
          />
          <DateInput
            label={t('admin:analyticsTo', 'To')}
            value={to}
            min={from || undefined}
            max={toLocalDateValue(new Date())}
            onChange={(e) => handleToChange(e.target.value)}
          />
        </div>

        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {t('admin:analyticsTrackingHint', 'Visit analytics starts collecting data after this tracking is deployed.')}
        </p>
      </Card>

      {loading ? (
        <Card>
          <p className="text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title={t('admin:analyticsTotalVisitors', 'Site visitors')} value={totalVisitors} />
          <MetricCard title={t('admin:analyticsUniversityVisitors', 'Universities visited')} value={universityVisitors} />
          <MetricCard title={t('admin:analyticsStudentVisitors', 'Students visited')} value={studentVisitors} />
          <MetricCard title={t('admin:analyticsRegistrations', 'Registrations')} value={registrations} />
        </div>
      )}
    </div>
  )
}
