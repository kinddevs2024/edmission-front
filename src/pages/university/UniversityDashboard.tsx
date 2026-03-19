import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { Badge } from '@/components/ui/Badge'
import { getDashboard, type UniversityDashboardData } from '@/services/university'
import { toastApiError } from '@/utils/toastError'
import { Bot, Users, BarChart3, MessageCircle, Send, ShieldCheck } from 'lucide-react'
import { getStudentDisplayName } from '@/utils/studentDisplay'

export function UniversityDashboard() {
  const { t } = useTranslation(['common', 'university'])
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<UniversityDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((error) => {
        toastApiError(error)
        setDashboard(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const pipeline = dashboard?.pipeline ?? []
  const interestedCount = dashboard?.interestedCount ?? 0
  const chatCount = dashboard?.chatCount ?? 0
  const offerSentCount = (dashboard?.offerSentCount ?? 0) + (dashboard?.pendingOffers ?? 0)
  const acceptanceRate = dashboard?.acceptanceRate ?? 0
  const totalInterests = dashboard?.totalInterests ?? 0
  const topRecs = dashboard?.topRecommendations ?? []
  const stageLabels: Record<string, string> = {
    interested: t('university:pipelineInterested', 'Interested'),
    under_review: t('university:pipelineEvaluating', 'Evaluating'),
    chat_opened: t('university:pipelineContacted', 'Contacted'),
    offer_sent: t('university:pipelineOfferSent', 'Offer sent'),
    rejected: t('university:pipelineRejected', 'Rejected'),
    accepted: t('university:pipelineAccepted', 'Accepted'),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2" data-onboarding="university-dashboard-overview">
        <PageTitle title={t('university:dashboard', 'Dashboard')} icon="LayoutDashboard" />
        {dashboard?.verified ? (
          <Badge variant="success" className="inline-flex items-center gap-1">
            <ShieldCheck size={14} /> {t('university:dashboardPage.verified', 'Verified')}
          </Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/university/pipeline">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary-accent" interactive>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} /> {t('university:newInterests', 'New interests')}
            </CardTitle>
            <p className="mt-1 text-2xl font-semibold">{loading ? '—' : interestedCount}</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('university:dashboardPage.total', {
                count: loading ? '—' : totalInterests,
                defaultValue: 'Total: {{count}}',
              })}
            </p>
          </Card>
        </Link>

        <Link to="/university/chat">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary-accent" interactive>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle size={18} /> {t('university:activeChats', 'Active chats')}
            </CardTitle>
            <p className="mt-1 text-2xl font-semibold">{loading ? '—' : chatCount}</p>
          </Card>
        </Link>

        <Link to="/university/pipeline">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary-accent" interactive>
            <CardTitle className="flex items-center gap-2">
              <Send size={18} /> {t('university:offersSent', 'Offers sent')}
            </CardTitle>
            <p className="mt-1 text-2xl font-semibold">{loading ? '—' : offerSentCount}</p>
          </Card>
        </Link>

        <Link to="/university/analytics">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary-accent" interactive>
            <CardTitle>{t('university:acceptanceRate', 'Acceptance rate')}</CardTitle>
            <p className="mt-1 text-2xl font-semibold">{loading ? '—' : `${acceptanceRate}%`}</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Link to="/university/pipeline">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary-accent" interactive>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} /> {t('university:pipelineFunnel', 'Pipeline')}
            </CardTitle>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {t('university:dashboardPage.pipelineSequence', 'Interested -> Contacted -> Evaluating -> Offer sent -> Accepted')}
            </p>
            <ul className="mt-3 space-y-2">
              {pipeline.length === 0 && !loading ? (
                <li className="text-[var(--color-text-muted)]">{t('university:dashboardPage.noDataYet', 'No data yet.')}</li>
              ) : null}
              {pipeline.map((item) => (
                <li key={item.status} className="flex items-center justify-between text-sm">
                  <span>{stageLabels[item.status] ?? item.status}</span>
                  <span className="font-medium">{item._count ?? 0}</span>
                </li>
              ))}
            </ul>
            <span className="mt-3 inline-block rounded-input border-2 border-[var(--color-border)] px-3 py-1.5 text-sm font-medium">
              {t('university:viewAnalytics', 'Full analytics')}
            </span>
          </Card>
        </Link>

        <Link to="/university/students">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary-accent" interactive>
            <CardTitle>{t('university:topRecommendations', 'Top recommended students')}</CardTitle>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('university:dashboardPage.bestMatchScore', 'Best match score')}</p>
            {loading ? (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
            ) : topRecs.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('university:dashboardPage.noRecommendationsYet', 'No recommendations yet.')}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {topRecs.slice(0, 5).map((recommendation) => {
                  const student = recommendation.student
                  const name = getStudentDisplayName(student, t('university:studentLabel', 'Student'))
                  const studentId = student && '_id' in student ? String((student as { _id: unknown })._id) : recommendation.id

                  return (
                    <li key={recommendation.id} className="flex items-center justify-between text-sm">
                      <span>{name}</span>
                      <span className="text-[var(--color-text-muted)]">
                        {recommendation.matchScore != null ? `${recommendation.matchScore}%` : ''} {student?.country ?? ''}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          navigate(`/university/students/${studentId}`)
                        }}
                        className="text-sm text-primary-accent hover:underline"
                      >
                        {t('university:dashboardPage.profileButton', 'Profile')}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <span className="mt-3 inline-block rounded-input border-2 border-[var(--color-border)] px-3 py-1.5 text-sm font-medium">
              {t('university:navDiscovery')}
            </span>
          </Card>
        </Link>
      </div>

      <Card className="border-primary-accent/20 bg-primary-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Bot size={18} /> Edmission AI
        </CardTitle>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {t('university:dashboardPage.aiDescription', 'Get suggestions, refine your profile, and explore answers about applications and scholarships.')}
        </p>
        <Button to="/university/ai" className="mt-3" icon={<Bot size={16} />}>
          {t('university:dashboardPage.openAi', 'Open Edmission AI')}
        </Button>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button to="/university/students">{t('university:navDiscovery')}</Button>
        <Button to="/university/pipeline" variant="secondary">{t('university:navPipeline')}</Button>
        <Button to="/university/scholarships" variant="secondary">{t('university:navScholarships')}</Button>
      </div>
    </div>
  )
}
