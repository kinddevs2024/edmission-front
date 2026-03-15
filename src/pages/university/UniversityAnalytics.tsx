import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { getFunnelAnalytics } from '@/services/university'
import { toastApiError } from '@/utils/toastError'

const STATUS_TO_KEY: Record<string, string> = {
  interested: 'university:pipelineInterested',
  under_review: 'university:pipelineEvaluating',
  chat_opened: 'university:pipelineContacted',
  offer_sent: 'university:pipelineOfferSent',
  rejected: 'university:pipelineRejected',
  accepted: 'university:pipelineAccepted',
}
const PIE_COLORS = ['#84CC16', '#3B82F6', '#64748B', '#F59E0B']

export function UniversityAnalytics() {
  const { t } = useTranslation('university')
  const [funnel, setFunnel] = useState<{ byStatus: Record<string, number>; total: number }>({ byStatus: {}, total: 0 })
  useEffect(() => {
    getFunnelAnalytics().then(setFunnel).catch(toastApiError)
  }, [])
  const funnelBar = Object.entries(funnel.byStatus).map(([status, count]) => ({
    stage: t(STATUS_TO_KEY[status] ?? status),
    count: Number(count) || 0,
  }))

  return (
    <div className="space-y-6">
      <PageTitle title={t('navAnalytics')} icon="BarChart3" />

      <Card>
        <CardTitle>{t('analyticsInterestOverTime')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('analyticsInterestOverTimeHint')}</p>
        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={funnelBar.length ? funnelBar.map((_, i) => ({ stage: String(i + 1), count: 0 })) : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="stage" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="count" stroke="var(--color-primary-accent)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>{t('analyticsPipelineFunnel')}</CardTitle>
          <p className="text-sm text-[var(--color-text-muted)]">{t('analyticsTotal')}: {funnel.total}</p>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelBar.length ? funnelBar : [{ stage: '—', count: 0 }]} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="stage" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
                <Bar dataKey="count" fill="var(--color-primary-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>{t('analyticsApplicationsByStatusPie')}</CardTitle>
          <p className="text-sm text-[var(--color-text-muted)]">{t('analyticsSamePipelineData')}</p>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={funnelBar.length ? funnelBar.map((f, i) => ({ name: f.stage, value: f.count, color: PIE_COLORS[i % PIE_COLORS.length] })) : []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {funnelBar.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
