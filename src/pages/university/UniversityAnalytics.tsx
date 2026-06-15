import { useEffect, useMemo, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/ui/PageTitle'
import { getFunnelAnalytics } from '@/services/university'
import { toastApiError } from '@/utils/toastError'
import { Card, CardBody, CardHeader, Progress, Typography } from '@material-tailwind/react'
import { MiniAreaAnalyticsCard } from '@/components/analytics/MiniAreaAnalyticsCard'

type MaterialComponent = ComponentType<{ children?: ReactNode; [key: string]: unknown }>

const MTCard = Card as unknown as MaterialComponent
const MTCardBody = CardBody as unknown as MaterialComponent
const MTCardHeader = CardHeader as unknown as MaterialComponent
const MTTypography = Typography as unknown as MaterialComponent
const MTProgress = Progress as unknown as MaterialComponent

const STATUS_TO_KEY: Record<string, string> = {
  interested: 'university:pipelineInterested',
  under_review: 'university:pipelineEvaluating',
  chat_opened: 'university:pipelineContacted',
  offer_sent: 'university:pipelineOfferSent',
  rejected: 'university:pipelineRejected',
  accepted: 'university:pipelineAccepted',
}
const STAGE_ORDER = ['interested', 'under_review', 'chat_opened', 'offer_sent', 'accepted', 'rejected'] as const

export function UniversityAnalytics() {
  const { t } = useTranslation('university')
  const [funnel, setFunnel] = useState<{ byStatus: Record<string, number>; total: number }>({ byStatus: {}, total: 0 })

  useEffect(() => {
    getFunnelAnalytics().then(setFunnel).catch(toastApiError)
  }, [])

  const funnelBar = useMemo(
    () =>
      STAGE_ORDER.map((status) => ({
        key: status,
        stage: t(STATUS_TO_KEY[status] ?? status),
        count: Number(funnel.byStatus[status] ?? 0),
      })),
    [funnel.byStatus, t]
  )
  const topStage = useMemo(
    () => funnelBar.reduce((max, current) => (current.count > max.count ? current : max), { key: 'none', stage: '—', count: 0 }),
    [funnelBar]
  )
  const conversionToChat = funnel.total > 0 ? Math.round(((funnel.byStatus.chat_opened ?? 0) / funnel.total) * 100) : 0
  const conversionToOffer = funnel.total > 0 ? Math.round(((funnel.byStatus.offer_sent ?? 0) / funnel.total) * 100) : 0
  const conversionToAccepted = funnel.total > 0 ? Math.round(((funnel.byStatus.accepted ?? 0) / funnel.total) * 100) : 0
  const analyticsSeriesByRange = useMemo(() => {
    const base = funnelBar.map((item) => item.count)
    return {
      '12h': base.map((v) => Math.max(0, Math.round(v * 0.78))),
      '24h': base,
      '7d': base.map((v, i) => Math.max(0, Math.round(v * (1.12 + i * 0.03)))),
    }
  }, [funnelBar])

  return (
    <div className="space-y-6">
      <PageTitle title={t('navAnalytics')} icon="BarChart3" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MTCard className="border border-gray-200 shadow-sm">
          <MTCardBody>
            <MTTypography variant="small" className="font-medium text-gray-600">
              {t('analyticsTotal', 'Total in funnel')}
            </MTTypography>
            <MTTypography variant="h3" color="blue-gray" className="mt-1">
              {funnel.total}
            </MTTypography>
          </MTCardBody>
        </MTCard>
        <MTCard className="border border-gray-200 shadow-sm">
          <MTCardBody>
            <MTTypography variant="small" className="font-medium text-gray-600">
              {t('analyticsTopStage', 'Top stage')}
            </MTTypography>
            <MTTypography variant="h5" color="blue-gray" className="mt-1">
              {topStage.stage}
            </MTTypography>
            <MTTypography variant="small" className="text-gray-500">
              {topStage.count} {t('analyticsStudents', 'students')}
            </MTTypography>
          </MTCardBody>
        </MTCard>
        <MTCard className="border border-gray-200 shadow-sm">
          <MTCardBody>
            <MTTypography variant="small" className="font-medium text-gray-600">
              {t('analyticsOfferConversion', 'Offer conversion')}
            </MTTypography>
            <MTTypography variant="h3" color="blue-gray" className="mt-1">
              {conversionToOffer}%
            </MTTypography>
            <MTTypography variant="small" className="text-gray-500">
              {t('analyticsAcceptedRate', 'Accepted')}: {conversionToAccepted}%
            </MTTypography>
          </MTCardBody>
        </MTCard>
      </div>

      <MiniAreaAnalyticsCard
        title={t('analyticsPipelineFunnel', 'Pipeline funnel')}
        value={String(funnel.total)}
        delta={t('analyticsSamePipelineData', 'Live stage distribution')}
        categories={funnelBar.map((item) => item.stage)}
        seriesByRange={analyticsSeriesByRange}
        metricOneLabel={t('analyticsChatConversion', 'Chat conversion')}
        metricOneValue={`${conversionToChat}%`}
        metricTwoLabel={t('analyticsOfferConversion', 'Offer conversion')}
        metricTwoValue={`${conversionToOffer}%`}
      />

      <MTCard className="border border-gray-200 shadow-sm">
        <MTCardHeader shadow={false} floated={false} className="bg-transparent pb-0">
          <MTTypography variant="h6" color="blue-gray">
            {t('analyticsApplicationsByStatusPie', 'Stage breakdown')}
          </MTTypography>
          <MTTypography variant="small" className="text-gray-500">
            {t('analyticsSamePipelineData', 'How your current pipeline is distributed')}
          </MTTypography>
        </MTCardHeader>
        <MTCardBody className="space-y-4">
          {funnelBar.map((item) => {
            const percent = funnel.total > 0 ? Math.round((item.count / funnel.total) * 100) : 0
            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <MTTypography variant="small" color="blue-gray" className="font-medium">
                    {item.stage}
                  </MTTypography>
                  <MTTypography variant="small" className="font-medium text-gray-700">
                    {item.count} ({percent}%)
                  </MTTypography>
                </div>
                <MTProgress value={percent} color="green" className="h-2 rounded-full bg-gray-200" />
              </div>
            )
          })}
        </MTCardBody>
      </MTCard>
    </div>
  )
}
