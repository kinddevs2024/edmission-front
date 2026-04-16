import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { UniversityCard } from '@/components/student/UniversityCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { getApplications, getOffers, getRecommendations, getCompareUniversities, getStudentProfile } from '@/services/student'
import { getMyDocuments } from '@/services/studentDocuments'
import { getNotifications } from '@/services/notifications'
import type { UniversityListItem } from '@/types/university'
import type { Application, Offer } from '@/types/student'
import { toastApiError } from '@/utils/toastError'
import { cn } from '@/utils/cn'
import { ArrowRight, Bell, Building2, CheckCircle, Circle, FileText, Gift, GraduationCap, SearchCheck, UserCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { trackStudentFunnel } from '@/analytics/studentFunnel'
import { useAuth } from '@/hooks/useAuth'
import {
  StudentMacroOnboarding,
  hasCompletedMacroOnboarding,
  markMacroOnboardingDone,
  resetMacroOnboardingForReplay,
} from '@/components/onboarding/StudentMacroOnboarding'
import { useStudentOnboardingFlowStore } from '@/store/studentOnboardingFlowStore'
import { shouldShowWelcomeMacroOnboarding } from '@/utils/studentOnboardingEligibility'

const DASHBOARD_RECOMMENDATIONS = 3

const statWatermarkClass =
  'pointer-events-none absolute h-[5.75rem] w-[5.75rem] text-primary-accent/[0.1] dark:text-primary-accent/[0.16] sm:h-[6.25rem] sm:w-[6.25rem]'

function DashboardStatWatermark({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon
      className={cn(statWatermarkClass, '-bottom-2 -right-2 sm:-bottom-2.5 sm:-right-2.5')}
      strokeWidth={1.15}
      aria-hidden
    />
  )
}

function DashboardActionCard({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: LucideIcon
  title: string
  description: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="group rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary-accent/40 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-accent/12 text-primary-accent">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</p>
          </div>
        </div>
        <ArrowRight
          className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-primary-accent"
          aria-hidden
        />
      </div>
    </Link>
  )
}

function recommendationRowToUniversityId(row: unknown): string {
  const r = row as Record<string, unknown>
  const uid = r.universityId
  if (typeof uid === 'string' && uid.trim()) return uid.trim()
  if (uid && typeof uid === 'object') {
    const o = uid as { id?: unknown; _id?: unknown }
    const s = String(o.id ?? o._id ?? '').trim()
    if (s) return s
  }
  const uni = r.university
  if (uni && typeof uni === 'object') {
    const o = uni as { id?: unknown; _id?: unknown; universityName?: unknown }
    const s = String(o.id ?? o._id ?? '').trim()
    if (s) return s
  }
  return ''
}

function mergeUniversityListsForDashboard(
  compare: UniversityListItem[],
  fallback: UniversityListItem[],
  limit: number
): UniversityListItem[] {
  const out: UniversityListItem[] = []
  const seen = new Set<string>()
  for (const u of compare) {
    const id = u?.id?.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(u)
    if (out.length >= limit) return out
  }
  for (const u of fallback) {
    const id = u?.id?.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(u)
    if (out.length >= limit) return out
  }
  return out
}

export function StudentDashboard() {
  const { t } = useTranslation(['student', 'common'])
  const { role } = useAuth()
  const [profilePercent, setProfilePercent] = useState(0)
  const [minimalComplete, setMinimalComplete] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [recommendations, setRecommendations] = useState<UniversityListItem[]>([])
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [docCount, setDocCount] = useState(0)
  const [macroOpen, setMacroOpen] = useState(false)
  const [digest, setDigest] = useState<{ id: string; title: string; link?: string }[]>([])
  const recTracked = useRef(false)

  useEffect(() => {
    trackStudentFunnel('student_home_view')
  }, [])

  useEffect(() => {
    if (hasCompletedMacroOnboarding()) {
      useStudentOnboardingFlowStore.getState().setMacroOnboardingDone()
      return
    }
    let cancelled = false
    let timer: number | undefined
    shouldShowWelcomeMacroOnboarding()
      .then((showWelcome) => {
        if (cancelled) return
        if (!showWelcome) {
          markMacroOnboardingDone()
          useStudentOnboardingFlowStore.getState().setMacroOnboardingDone()
          return
        }
        timer = window.setTimeout(() => setMacroOpen(true), 400)
      })
      .catch(() => {
        if (cancelled) return
        timer = window.setTimeout(() => setMacroOpen(true), 400)
      })
    return () => {
      cancelled = true
      if (timer != null) window.clearTimeout(timer)
    }
  }, [])

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
    getNotifications({ limit: 3 }, role ?? null)
      .then((res) => {
        const rows = (res.data ?? []).map((n) => ({
          id: n.id,
          title: (n.title || n.body || '').trim() || t('navNotifications', 'Notifications'),
          link: n.link,
        }))
        setDigest(rows)
      })
      .catch(() => setDigest([]))
  }, [role, t])

  useEffect(() => {
    let cancelled = false
    setLoadingRecs(true)
    const toId = (v: unknown) =>
      typeof v === 'string'
        ? v
        : v && typeof v === 'object' && ('id' in v || '_id' in v)
          ? String((v as { id?: unknown; _id?: unknown }).id ?? (v as { _id?: unknown })._id ?? '')
          : ''
    const mapRecommendationToUniversity = (item: any): UniversityListItem | null => {
      const source = item?.university && typeof item.university === 'object' ? item.university : item
      const id =
        recommendationRowToUniversityId(item) || toId(item?.universityId) || toId(source?._id) || toId(source?.id) || toId(item?.id)
      const name = String(source?.name ?? source?.universityName ?? '').trim()
      if (!id || !name) return null
      return {
        id,
        name,
        country: source?.country,
        city: source?.city,
        description: source?.description,
        logo: source?.logo ?? source?.logoUrl,
        logoUrl: source?.logoUrl ?? source?.logo,
        matchScore: typeof item?.matchScore === 'number' ? item.matchScore : undefined,
      } as UniversityListItem
    }
    getRecommendations({ limit: 12 })
      .then((recs) => {
        if (cancelled || !recs.data?.length) return { compare: [] as UniversityListItem[], fallback: [] as UniversityListItem[] }
        const fallback = recs.data
          .map((r) => mapRecommendationToUniversity(r))
          .filter((u): u is UniversityListItem => Boolean(u))
        const ids = [...new Set(recs.data.map((r) => recommendationRowToUniversityId(r)).filter(Boolean))].slice(0, 12)
        if (ids.length === 0) return { compare: [], fallback }
        return getCompareUniversities(ids).then((compare) => ({ compare, fallback }))
      })
      .then((result) => {
        if (cancelled || !result) return
        const list = mergeUniversityListsForDashboard(result.compare ?? [], result.fallback ?? [], DASHBOARD_RECOMMENDATIONS)
        if (!list.length) return
        setRecommendations(
          list.map((u) => ({
            ...u,
            name: u.name ?? (u as unknown as { universityName?: string }).universityName ?? '',
          }))
        )
      })
      .catch((e) => {
        toastApiError(e)
        setRecommendations([])
      })
      .finally(() => {
        if (!cancelled) setLoadingRecs(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (recTracked.current) return
    if (!loadingRecs && minimalComplete && recommendations.length > 0) {
      recTracked.current = true
      trackStudentFunnel('student_first_recommendations_shown', { count: recommendations.length })
    }
  }, [loadingRecs, minimalComplete, recommendations.length])

  const activeApplications = applications.filter((a) => !['rejected', 'accepted'].includes(a.status))
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length
  const onboardingSteps = useMemo(
    () => [
      { label: t('stepMinimalProfile'), to: '/student/profile', done: minimalComplete },
      { label: t('stepUploadDocument'), to: '/student/documents', done: docCount > 0 },
      {
        label: t('student:stepFirstApplication', 'Show interest to one university'),
        to: '/student/universities',
        done: applications.length > 0,
      },
    ],
    [t, minimalComplete, docCount, applications.length]
  )
  const onboardingDone = onboardingSteps.every((s) => s.done)
  const nextIncomplete = onboardingSteps.find((s) => !s.done)
  const showAppsSection = activeApplications.length > 0
  const showOffersSection = offers.length > 0
  const showAppsOffersGrid = showAppsSection || showOffersSection
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.done).length
  const setupProgressPercent = onboardingSteps.length ? Math.round((completedOnboardingSteps / onboardingSteps.length) * 100) : 0

  const primaryCtaTo = '/student/universities'
  const primaryLabel = minimalComplete
    ? t('homePrimaryCtaExplore', 'Explore universities')
    : t('homePrimaryCta', 'Get my recommendations')

  return (
    <div className="space-y-8 pb-page-bottom-cta">
      <StudentMacroOnboarding open={macroOpen} onClose={() => setMacroOpen(false)} />

      <section
        className="relative overflow-hidden rounded-card border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,252,203,0.55))] p-5 shadow-[var(--shadow-card)] dark:bg-[linear-gradient(135deg,rgba(17,24,39,0.98),rgba(24,39,8,0.96))] sm:p-8"
        data-onboarding="student-home-mission"
      >
        <div
          className={cn(
            'relative z-[1] grid gap-5 lg:items-start',
            onboardingDone ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.95fr)]'
          )}
        >
          <div className="max-w-2xl space-y-4">
          <PageTitle title={t('studentDashboardTitle')} icon="LayoutDashboard" />
          <p className="text-lg font-medium leading-snug text-[var(--color-text)]">
            {t('homeMissionTitle', 'Find universities that fit you — show interest in one tap.')}
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t(
              'homeMissionSubtitle',
              'We use your profile to suggest matches. Complete the basics to unlock personalized picks.'
            )}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              to={primaryCtaTo}
              size="lg"
              className="min-h-[48px] w-full sm:w-auto"
              onClick={() => {
                trackStudentFunnel('student_home_primary_cta', { target: primaryCtaTo })
              }}
            >
              {primaryLabel}
            </Button>
            {nextIncomplete ? (
              <Button to={nextIncomplete.to} variant="secondary" size="lg" className="min-h-[48px] w-full sm:w-auto">
                {t('profileMeterNextStep', { defaultValue: 'Next: {{step}}', step: nextIncomplete.label })}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('unlockBetterMatches', 'Stronger profile → better matches.')}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/75 px-3 py-1">
              {t('student:profileCompletion', 'Profile completion')}: {profilePercent}%
            </span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/75 px-3 py-1">
              {t('student:activeApplications', 'Active interests')}: {activeApplications.length}
            </span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/75 px-3 py-1">
              {t('student:offers', 'Offers')}: {offers.length}
            </span>
          </div>
        </div>
        {!onboardingDone ? (
          <div className="rounded-[28px] border border-white/60 bg-[var(--color-card)]/88 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {t('student:dashboardFocus', 'Focus now')}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">
              {t('student:dashboardFocusSetup', 'Finish the basics to unlock stronger matches')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t('student:dashboardFocusSetupHint', 'Students move faster when profile, documents, and first interest are already prepared.')}
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/90 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{t('student:setupProgress', 'Setup progress')}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {completedOnboardingSteps}/{onboardingSteps.length} {t('student:stepsDone', 'steps done')}
                  </p>
                </div>
                <span className="text-2xl font-semibold text-primary-accent">{setupProgressPercent}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]">
                <div className="h-full rounded-full bg-primary-accent transition-[width] duration-500" style={{ width: `${setupProgressPercent}%` }} />
              </div>
            </div>
          </div>
        ) : null}
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary-accent/10 blur-2xl"
          aria-hidden
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardActionCard
          icon={UserCircle}
          title={t('student:dashboardActionProfileTitle', 'Complete your profile')}
          description={t('student:dashboardActionProfileHint', 'Add details once so recommendations and university replies are more accurate.')}
          to="/student/profile"
        />
        <DashboardActionCard
          icon={SearchCheck}
          title={t('student:dashboardActionExploreTitle', 'Explore universities')}
          description={t('student:dashboardActionExploreHint', 'Use filters, compare options, and save your next shortlist quickly.')}
          to="/student/universities"
        />
        <DashboardActionCard
          icon={FileText}
          title={t('student:dashboardActionDocsTitle', 'Keep documents ready')}
          description={t('student:dashboardActionDocsHint', 'Upload key files early so you can respond without delays when a university asks.')}
          to="/student/documents"
        />
      </div>

      <Link
        to="/student/profile"
        className="block rounded-card border border-primary-accent/25 bg-[var(--color-card)] p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary-accent/50"
        data-onboarding="dashboard-profile-meter"
        onClick={() => trackStudentFunnel('student_profile_meter_click')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">{t('profileCompletion')}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {t('unlockBetterMatches', 'Stronger profile → better matches.')}
            </p>
          </div>
          <span className="text-2xl font-semibold text-primary-accent">{profilePercent}%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-primary-accent transition-[width] duration-500"
            style={{ width: `${profilePercent}%` }}
          />
        </div>
      </Link>

      {digest.length > 0 ? (
        <Card className="border-[var(--color-border)]">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-accent shrink-0" aria-hidden />
              {t('notificationDigestTitle', 'Recent updates')}
            </CardTitle>
            <Link to="/notifications" className="text-sm font-medium text-primary-accent hover:underline">
              {t('viewAll', 'View all')}
            </Link>
          </div>
          <ul className="mt-3 space-y-2" role="list">
            {digest.map((n) => (
              <li key={n.id}>
                {n.link ? (
                  <Link to={n.link} className="block rounded-input px-2 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/25 min-h-[44px]">
                    {n.title}
                  </Link>
                ) : (
                  <span className="block px-2 py-2.5 text-sm text-[var(--color-text-muted)]">{n.title}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="border-primary-accent/30" data-onboarding="dashboard-get-started">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{onboardingDone ? t('onboardingAllSetTitle', 'You are on track') : t('getStarted')}</CardTitle>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {onboardingDone
                ? t('onboardingAllSetHint', 'Use Home for your next step and Explore to find universities.')
                : t('getStartedHint')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetMacroOnboardingForReplay()
              setMacroOpen(true)
            }}
            className="text-xs font-medium text-primary-accent hover:underline min-h-[44px] px-1"
          >
            {t('onboardingReplayIntro', 'Replay introduction')}
          </button>
        </div>
        {!onboardingDone ? (
          <ul className="mt-3 space-y-2" role="list">
            {onboardingSteps.map((step) => (
              <li key={step.to} className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" aria-hidden />
                )}
                <Link to={step.to} className="text-sm text-primary-accent hover:underline min-h-[44px] inline-flex items-center">
                  {step.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Link to="/student/profile">
          <Card className="relative h-full min-h-[100px] cursor-pointer overflow-hidden hover:border-primary-accent animate-card-enter transition-colors" interactive>
            <DashboardStatWatermark icon={UserCircle} />
            <div className="relative z-[1]">
              <CardTitle className="text-sm">{t('profileCompletion')}</CardTitle>
              <p className="mt-1 text-xl font-semibold text-primary-accent">{profilePercent}%</p>
            </div>
          </Card>
        </Link>
        <Link to="/student/interests">
          <Card
            className="relative h-full min-h-[100px] cursor-pointer overflow-hidden hover:border-primary-accent animate-card-enter animate-stagger-1 transition-colors"
            interactive
          >
            <DashboardStatWatermark icon={Building2} />
            <div className="relative z-[1]">
              <CardTitle className="text-sm">{t('activeApplications', 'Active interests')}</CardTitle>
              <p className="text-xl font-semibold">{activeApplications.length}</p>
            </div>
          </Card>
        </Link>
        <Link to="/student/offers">
          <Card
            className="relative h-full min-h-[100px] cursor-pointer overflow-hidden hover:border-primary-accent animate-card-enter animate-stagger-2 transition-colors"
            interactive
          >
            <DashboardStatWatermark icon={Gift} />
            <div className="relative z-[1]">
              <CardTitle className="text-sm">{t('offers')}</CardTitle>
              <p className="text-xl font-semibold">{offers.length}</p>
            </div>
          </Card>
        </Link>
        <Link to="/student/interests">
          <Card
            className="relative h-full min-h-[100px] cursor-pointer overflow-hidden hover:border-primary-accent animate-card-enter animate-stagger-3 transition-colors"
            interactive
          >
            <DashboardStatWatermark icon={GraduationCap} />
            <div className="relative z-[1]">
              <CardTitle className="text-sm">{t('accepted')}</CardTitle>
              <p className="text-xl font-semibold">{acceptedCount}</p>
            </div>
          </Card>
        </Link>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('recommendedUniversities')}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {minimalComplete
                ? t('student:dashboardRecommendationsHint', 'Start with these picks, then use Explore to compare details and filters.')
                : t('student:dashboardRecommendationsLocked', 'Finish the minimum profile to unlock tailored recommendations.')}
            </p>
          </div>
          <Button to="/student/universities" variant="secondary" size="sm">
            {t('homePrimaryCtaExplore', 'Explore universities')}
          </Button>
        </div>
        {loadingRecs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : minimalComplete && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, DASHBOARD_RECOMMENDATIONS).map((u, index) => (
              <div
                key={u.id}
                className="animate-card-enter opacity-0"
                style={{ animationDelay: `${Math.min(index, 9) * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <UniversityCard university={u} showRequirements={false} onInterest={() => {}} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)]">
            <EmptyState
              title={minimalComplete ? t('student:noUniversitiesFound', 'No universities found') : t('emptyRecsTitle', 'No recommendations yet')}
              description={
                minimalComplete
                  ? t('tryChangingFiltersOrSearch', 'Try changing filters or search to see more results.')
                  : t('emptyRecsBody', 'Tell us a bit more about you to see universities picked for your profile.')
              }
              actionLabel={t('homePrimaryCtaExplore', 'Explore universities')}
              actionTo="/student/universities"
            />
            {!minimalComplete ? (
              <p className="px-4 pb-8 text-center text-sm text-[var(--color-text-muted)]">{t('completeProfileForRecs')}</p>
            ) : null}
          </div>
        )}
      </div>

      {showAppsOffersGrid ? (
        <div
          className={
            showAppsSection && showOffersSection ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'grid grid-cols-1 gap-6'
          }
        >
          {showAppsSection ? (
            <Link to="/student/interests">
              <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
                <CardTitle>{t('activeApplications', 'Active interests')}</CardTitle>
                <ul className="mt-3 space-y-2">
                  {activeApplications.slice(0, 5).map((a) => (
                    <li
                      key={a.id}
                      className="grid grid-cols-[minmax(0,1fr)_104px_52px] items-center gap-x-4 rounded-2xl px-1 py-1 min-h-[44px]"
                    >
                      <span className="truncate pr-2">{a.universityName ?? a.universityId}</span>
                      <span className="justify-self-start text-sm text-[var(--color-text-muted)]">{a.status}</span>
                      <span className="justify-self-end text-sm text-primary-accent">{t('view')}</span>
                    </li>
                  ))}
                </ul>
                <span className="inline-block mt-3 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">
                  {t('allApplications', 'All interests')}
                </span>
              </Card>
            </Link>
          ) : null}
          {showOffersSection ? (
            <Link to="/student/offers">
              <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
                <CardTitle>{t('recentOffers')}</CardTitle>
                <ul className="mt-3 space-y-2">
                  {offers.slice(0, 3).map((o) => (
                    <li
                      key={o.id}
                      className="grid grid-cols-[minmax(0,1fr)_52px] items-center gap-x-4 rounded-2xl px-1 py-1 min-h-[44px]"
                    >
                      <span className="truncate pr-2">{o.universityName ?? o.universityId}</span>
                      <span className="justify-self-end text-sm text-primary-accent">{t('view')}</span>
                    </li>
                  ))}
                </ul>
                <span className="inline-block mt-3 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">
                  {t('allOffers')}
                </span>
              </Card>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-6">
        <Button to="/student/chat" variant="secondary">
          {t('chats')}
        </Button>
        <Button to="/student/ai" variant="ghost">
          {t('navEdmissionAi', 'Edmission AI')}
        </Button>
      </div>
    </div>
  )
}
