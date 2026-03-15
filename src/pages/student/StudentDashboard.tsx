import { useEffect, useState } from 'react'
import { getProfile } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { OnboardingTutorialModal, hasSeenTutorial } from '@/components/onboarding/OnboardingTutorialModal'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { UniversityCard } from '@/components/student/UniversityCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { getApplications, getOffers, getRecommendations, getCompareUniversities, getStudentProfile } from '@/services/student'
import { getMyDocuments } from '@/services/studentDocuments'
import type { UniversityListItem } from '@/types/university'
import type { Application, Offer } from '@/types/student'
import { toastApiError } from '@/utils/toastError'
import { CheckCircle, Circle } from 'lucide-react'

export function StudentDashboard() {
  const { t } = useTranslation('student')
  const [showTutorial, setShowTutorial] = useState(false)
  useEffect(() => {
    getProfile().then(() => {
      const u = useAuthStore.getState().user
      if (!hasSeenTutorial('student', u)) setShowTutorial(true)
    }).catch(() => {})
  }, [])
  const [profilePercent, setProfilePercent] = useState(0)
  const [minimalComplete, setMinimalComplete] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [recommendations, setRecommendations] = useState<UniversityListItem[]>([])
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [docCount, setDocCount] = useState(0)

  useEffect(() => {
    getApplications({ limit: 100 }).then((r) => setApplications(r.data ?? [])).catch(toastApiError)
    getOffers({ limit: 100 }).then((r) => setOffers(r.data ?? [])).catch(toastApiError)
    getMyDocuments().then((d) => setDocCount(d.length)).catch(toastApiError)
    getStudentProfile()
      .then((p) => {
        setProfilePercent(p.portfolioCompletionPercent ?? 0)
        setMinimalComplete(p.minimalPortfolioComplete ?? false)
      })
      .catch(toastApiError)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingRecs(true)
    getRecommendations({ limit: 5 })
      .then((recs) => {
        if (cancelled || !recs.data?.length) return
        const toId = (v: unknown) => (typeof v === 'string' ? v : (v && typeof v === 'object' && ('id' in v || '_id' in v) ? String((v as { id?: unknown; _id?: unknown }).id ?? (v as { _id?: unknown })._id ?? '') : ''))
        const ids = recs.data.map((r) => toId(r.universityId)).filter(Boolean).slice(0, 5)
        return getCompareUniversities(ids)
      })
      .then((list) => {
        if (cancelled || !list?.length) return
        setRecommendations(list.map((u) => ({
          ...u,
          name: u.name ?? (u as unknown as { universityName?: string }).universityName ?? '',
        })))
      })
      .catch((e) => { toastApiError(e); setRecommendations([]) })
      .finally(() => { if (!cancelled) setLoadingRecs(false) })
    return () => { cancelled = true }
  }, [])

  const activeApplications = applications.filter((a) => !['rejected', 'accepted'].includes(a.status))
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length
  const onboardingSteps = [
    { label: t('stepMinimalProfile'), to: '/student/profile', done: minimalComplete },
    { label: t('stepUploadDocument'), to: '/student/documents', done: docCount > 0 },
  ]
  const onboardingDone = onboardingSteps.every((s) => s.done)

  return (
    <div className="space-y-8 pb-12 mb-4">
      <OnboardingTutorialModal open={showTutorial} onClose={() => setShowTutorial(false)} variant="student" />
      <PageTitle title={t('studentDashboardTitle')} icon="LayoutDashboard" />

      {!onboardingDone && (
        <Card className="border-primary-accent/30">
          <CardTitle>{t('getStarted')}</CardTitle>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('getStartedHint')}</p>
          <ul className="mt-3 space-y-2" role="list">
            {onboardingSteps.map((step) => (
              <li key={step.to} className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" aria-hidden />
                )}
                <Link to={step.to} className="text-sm text-primary-accent hover:underline">
                  {step.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/student/profile">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors animate-card-enter" interactive>
            <CardTitle>{t('profileCompletion')}</CardTitle>
            <div className="mt-2">
              <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-accent transition-[width] duration-500"
                  style={{ width: `${profilePercent}%` }}
                />
              </div>
              <p className="text-2xl font-semibold text-primary-accent mt-1">{profilePercent}%</p>
            </div>
          </Card>
        </Link>
        <Link to="/student/applications">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors animate-card-enter animate-stagger-1" interactive>
            <CardTitle>{t('activeApplications')}</CardTitle>
            <p className="text-2xl font-semibold">{activeApplications.length}</p>
          </Card>
        </Link>
        <Link to="/student/offers">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors animate-card-enter animate-stagger-2" interactive>
            <CardTitle>{t('offers')}</CardTitle>
            <p className="text-2xl font-semibold">{offers.length}</p>
          </Card>
        </Link>
        <Link to="/student/applications">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors animate-card-enter animate-stagger-3" interactive>
            <CardTitle>{t('accepted')}</CardTitle>
            <p className="text-2xl font-semibold">{acceptedCount}</p>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('recommendedUniversities')}</h2>
        {loadingRecs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 5).map((u, index) => (
              <div
                key={u.id}
                className="animate-card-enter opacity-0"
                style={{ animationDelay: `${Math.min(index, 9) * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <UniversityCard university={u} showMatch showRequirements={false} onInterest={() => {}} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)]">{t('completeProfileForRecs')}</p>
        )}
        <Link
          to="/student/universities"
          className="inline-block mt-4 px-4 py-2 text-sm font-medium rounded-input bg-primary-accent text-primary-dark hover:opacity-90 transition-opacity"
        >
          {t('exploreUniversities')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link to="/student/applications">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
            <CardTitle>{t('activeApplications')}</CardTitle>
          {activeApplications.length === 0 ? (
            <p className="text-[var(--color-text-muted)]">{t('noActiveApplications')}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {activeApplications.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-[minmax(0,1fr)_104px_52px] items-center gap-x-4 rounded-2xl px-1 py-1"
                >
                  <span className="truncate pr-2">{a.universityName ?? a.universityId}</span>
                  <span className="justify-self-start text-sm text-[var(--color-text-muted)]">{a.status}</span>
                  <button type="button" className="justify-self-end text-sm text-primary-accent hover:underline">{t('view')}</button>
                </li>
              ))}
            </ul>
          )}
          <span className="inline-block mt-3 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">{t('allApplications')}</span>
          </Card>
        </Link>
        <Link to="/student/offers">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
          <CardTitle>{t('recentOffers')}</CardTitle>
          {offers.length === 0 ? (
            <p className="text-[var(--color-text-muted)]">{t('noOffersYet')}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {offers.slice(0, 3).map((o) => (
                <li
                  key={o.id}
                  className="grid grid-cols-[minmax(0,1fr)_52px] items-center gap-x-4 rounded-2xl px-1 py-1"
                >
                  <span className="truncate pr-2">{o.universityName ?? o.universityId}</span>
                  <button type="button" className="justify-self-end text-sm text-primary-accent hover:underline">{t('view')}</button>
                </li>
              ))}
            </ul>
          )}
          <span className="inline-block mt-3 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">{t('allOffers')}</span>
          </Card>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button to="/student/universities">{t('exploreUniversities')}</Button>
        <Button to="/student/applications" variant="secondary">{t('myApplications')}</Button>
        <Button to="/student/chat" variant="ghost">{t('chats')}</Button>
      </div>
    </div>
  )
}
