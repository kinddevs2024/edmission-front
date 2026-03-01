import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { Badge } from '@/components/ui/Badge'
import { getDashboard, getFunnelAnalytics, type UniversityDashboardData } from '@/services/university'
import { Bot, Users, BarChart3, MessageCircle, Send, ShieldCheck } from 'lucide-react'

const STAGE_LABELS: Record<string, string> = {
  interested: 'Interested',
  under_review: 'Evaluating',
  chat_opened: 'Contacted',
  offer_sent: 'Offer sent',
  rejected: 'Rejected',
  accepted: 'Accepted',
}

export function UniversityDashboard() {
  const { t } = useTranslation(['common', 'university'])
  const [dashboard, setDashboard] = useState<UniversityDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false))
  }, [])

  const pipeline = dashboard?.pipeline ?? []
  const interestedCount = dashboard?.interestedCount ?? 0
  const chatCount = dashboard?.chatCount ?? 0
  const offerSentCount = (dashboard?.offerSentCount ?? 0) + (dashboard?.pendingOffers ?? 0)
  const acceptanceRate = dashboard?.acceptanceRate ?? 0
  const totalInterests = dashboard?.totalInterests ?? 0
  const topRecs = dashboard?.topRecommendations ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <PageTitle title={t('university:dashboard', 'Dashboard')} icon="LayoutDashboard" />
        {dashboard?.verified && (
          <Badge variant="success" className="inline-flex items-center gap-1">
            <ShieldCheck size={14} /> Verified
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} /> {t('university:newInterests', 'New interests')}
          </CardTitle>
          <p className="text-2xl font-semibold mt-1">{loading ? '—' : interestedCount}</p>
          <p className="text-sm text-[var(--color-text-muted)]">Total: {loading ? '—' : totalInterests}</p>
        </Card>
        <Card>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle size={18} /> {t('university:activeChats', 'Active chats')}
          </CardTitle>
          <p className="text-2xl font-semibold mt-1">{loading ? '—' : chatCount}</p>
        </Card>
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Send size={18} /> {t('university:offersSent', 'Offers sent')}
          </CardTitle>
          <p className="text-2xl font-semibold mt-1">{loading ? '—' : offerSentCount}</p>
        </Card>
        <Card>
          <CardTitle>{t('university:acceptanceRate', 'Acceptance rate')}</CardTitle>
          <p className="text-2xl font-semibold mt-1">{loading ? '—' : `${acceptanceRate}%`}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={18} /> {t('university:pipelineFunnel', 'Pipeline')}
          </CardTitle>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Interested → Contacted → Evaluating → Offer Sent → Accepted
          </p>
          <ul className="mt-3 space-y-2">
            {pipeline.length === 0 && !loading && (
              <li className="text-[var(--color-text-muted)]">No data yet.</li>
            )}
            {pipeline.map((p) => (
              <li key={p.status} className="flex justify-between items-center text-sm">
                <span>{STAGE_LABELS[p.status] ?? p.status}</span>
                <span className="font-medium">{p._count ?? 0}</span>
              </li>
            ))}
          </ul>
          <Button to="/university/analytics" variant="secondary" size="sm" className="mt-3">
            {t('university:viewAnalytics', 'Full analytics')}
          </Button>
        </Card>

        <Card>
          <CardTitle>{t('university:topRecommendations', 'Top recommended students')}</CardTitle>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Best match score</p>
          {loading ? (
            <p className="text-[var(--color-text-muted)] mt-2 text-sm">Loading…</p>
          ) : topRecs.length === 0 ? (
            <p className="text-[var(--color-text-muted)] mt-2 text-sm">No recommendations yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {topRecs.slice(0, 5).map((r) => {
                const st = r.student
                const name = st ? [st.firstName, st.lastName].filter(Boolean).join(' ') || 'Student' : 'Student'
                const studentId = st && '_id' in st ? String((st as { _id: unknown })._id) : r.id
                return (
                  <li key={r.id} className="flex justify-between items-center text-sm">
                    <span>{name}</span>
                    <span className="text-[var(--color-text-muted)]">
                      {r.matchScore != null ? `${r.matchScore}%` : ''} {st?.country ?? ''}
                    </span>
                    <Button to={`/university/students/${studentId}`} variant="ghost" size="sm">
                      Profile
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
          <Button to="/university/students" variant="secondary" size="sm" className="mt-3">
            {t('university:navDiscovery')}
          </Button>
        </Card>
      </div>

      <Card className="border-primary-accent/20 bg-primary-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Bot size={18} /> Edmission AI
        </CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Get suggestions, refine your profile, and explore answers about applications and scholarships.
        </p>
        <Button to="/university/ai" className="mt-3" icon={<Bot size={16} />}>
          Open Edmission AI
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
