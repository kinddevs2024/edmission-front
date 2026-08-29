import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  FileCheck2,
  Gift,
  GraduationCap,
  Search,
  Sparkles,
} from 'lucide-react'
import { AcademicCertificate } from '@/components/student/AcademicCertificate'
import { CertificateEditorModal } from '@/components/student/CertificateEditorModal'
import { RankingTrigger } from '@/components/student/RankingTrigger'
import { StudentBadge } from '@/components/student/StudentBadge'
import { StudentRankingSheet } from '@/components/student/StudentRankingSheet'
import { UniversityCard } from '@/components/student/UniversityCard'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { PageTitle } from '@/components/ui/PageTitle'
import { trackStudentFunnel } from '@/analytics/studentFunnel'
import { useAuth } from '@/hooks/useAuth'
import { getNotifications } from '@/services/notifications'
import {
  getApplications,
  getCompareUniversities,
  getOffers,
  getRecommendations,
  getStudentProfile,
  getStudentRanking,
  updateStudentProfile,
  type StudentProfileData,
  type StudentRankingRow,
} from '@/services/student'
import { getMyDocuments } from '@/services/studentDocuments'
import type { Application, Offer } from '@/types/student'
import type { UniversityListItem } from '@/types/university'
import { resolveStudentLevel, STUDENT_LEVEL_CRITERIA } from '@/config/studentLevels'
import { getAcademicCertificateCompletion, type AcademicCertificateFieldId } from '@/utils/academicCertificate'
import { cn } from '@/utils/cn'
import { notifySuccess } from '@/utils/notify'

const DASHBOARD_RECOMMENDATIONS = 3

function recommendationRowToUniversityId(row: unknown): string {
  const item = row as Record<string, unknown>
  const value = item.universityId
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object') {
    const nested = value as { id?: unknown; _id?: unknown }
    return String(nested.id ?? nested._id ?? '').trim()
  }
  const university = item.university
  if (university && typeof university === 'object') {
    const nested = university as { id?: unknown; _id?: unknown }
    return String(nested.id ?? nested._id ?? '').trim()
  }
  return ''
}

function mapRecommendation(item: unknown): UniversityListItem | null {
  const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
  const source = row.university && typeof row.university === 'object' ? row.university as Record<string, unknown> : row
  const id = recommendationRowToUniversityId(row) || String(source.id ?? source._id ?? '').trim()
  const name = String(source.name ?? source.universityName ?? '').trim()
  if (!id || !name) return null
  return {
    id,
    name,
    country: source.country as string | undefined,
    city: source.city as string | undefined,
    description: source.description as string | undefined,
    logo: (source.logo ?? source.logoUrl) as string | undefined,
    logoUrl: (source.logoUrl ?? source.logo) as string | undefined,
    matchScore: typeof row.matchScore === 'number' ? row.matchScore : undefined,
  } as UniversityListItem
}

async function loadRecommendations(): Promise<UniversityListItem[]> {
  const recs = await getRecommendations({ limit: 12 })
  if (!recs.data?.length) return []
  const fallback = recs.data.map(mapRecommendation).filter((item): item is UniversityListItem => Boolean(item))
  const ids = [...new Set(recs.data.map(recommendationRowToUniversityId).filter(Boolean))].slice(0, 12)
  if (!ids.length) return fallback.slice(0, DASHBOARD_RECOMMENDATIONS)
  try {
    const compare = await getCompareUniversities(ids)
    const seen = new Set<string>()
    return [...compare, ...fallback]
      .filter((university) => {
        if (!university.id || seen.has(university.id)) return false
        seen.add(university.id)
        return true
      })
      .slice(0, DASHBOARD_RECOMMENDATIONS)
  } catch {
    return fallback.slice(0, DASHBOARD_RECOMMENDATIONS)
  }
}

function nextCertificateField(profile: StudentProfileData | null): AcademicCertificateFieldId {
  if (!profile?.firstName || !profile.lastName) return 'name'
  if (!profile.country || !profile.city) return 'location'
  if (!profile.schoolName && !profile.schoolsAttended?.some((school) => school.institutionName)) return 'school'
  if (!profile.graduationYear) return 'graduationYear'
  if (profile.gpa == null && !profile.schoolsAttended?.some((school) => school.gradeAverage != null)) return 'gpa'
  if (!profile.targetDegreeLevel) return 'degree'
  if (!profile.languageLevel && !profile.languages?.length) return 'language'
  if (!profile.interestedFaculties?.length && !profile.interests?.length) return 'academicFocus'
  return 'destinations'
}

const JOURNEY_STEPS = [
  { label: 'Complete certificate', icon: FileCheck2 },
  { label: 'Get discovered', icon: Search },
  { label: 'Receive offers', icon: Gift },
  { label: 'Choose university', icon: GraduationCap },
]

export function StudentDashboard() {
  const { t } = useTranslation(['student', 'common'])
  const { role } = useAuth()
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [recommendations, setRecommendations] = useState<UniversityListItem[]>([])
  const [docCount, setDocCount] = useState(0)
  const [digest, setDigest] = useState<{ id: string; title: string; link?: string }[]>([])
  const [rankingRows, setRankingRows] = useState<StudentRankingRow[]>([])
  const [rankingOpen, setRankingOpen] = useState(false)
  const [editorField, setEditorField] = useState<AcademicCertificateFieldId | null>(null)
  const [loading, setLoading] = useState(true)
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)

  useEffect(() => {
    trackStudentFunnel('student_home_view')
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setRecommendationsLoading(true)
    Promise.allSettled([
      getStudentProfile(),
      getApplications({ limit: 100 }),
      getOffers({ limit: 100 }),
      getMyDocuments(),
      getNotifications({ limit: 3 }, role ?? null),
      loadRecommendations(),
      getStudentRanking('global', 8),
    ]).then(([profileResult, applicationsResult, offersResult, docsResult, notificationsResult, recommendationsResult, rankingResult]) => {
      if (cancelled) return
      if (profileResult.status === 'fulfilled') setProfile(profileResult.value)
      else setProfileError(true)
      if (applicationsResult.status === 'fulfilled') setApplications(applicationsResult.value.data ?? [])
      if (offersResult.status === 'fulfilled') setOffers(offersResult.value.data ?? [])
      if (docsResult.status === 'fulfilled') setDocCount(docsResult.value.length)
      if (notificationsResult.status === 'fulfilled') {
        setDigest((notificationsResult.value.data ?? []).map((notification) => ({
          id: notification.id,
          title: (notification.title || notification.body || '').trim() || t('navNotifications', 'Notifications'),
          link: notification.link,
        })))
      }
      if (recommendationsResult.status === 'fulfilled') setRecommendations(recommendationsResult.value)
      if (rankingResult.status === 'fulfilled') setRankingRows(rankingResult.value.rows)
      setLoading(false)
      setRecommendationsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [role, t])

  const activeApplications = useMemo(() => applications.filter((application) => !['rejected', 'accepted'].includes(application.status)), [applications])
  const grantsCount = useMemo(() => offers.filter((offer) => (offer.coveragePercent ?? 0) >= STUDENT_LEVEL_CRITERIA.grantCoveragePercent).length, [offers])
  const certificateCompletion = getAcademicCertificateCompletion(profile)
  const currentRanking = rankingRows.find((row) => row.isCurrentUser)
  const fallbackLevel = resolveStudentLevel(profile?.portfolioCompletionPercent ?? certificateCompletion, offers.length, grantsCount)
  const levelState = currentRanking ?? fallbackLevel

  const saveCertificateField = async (patch: Partial<StudentProfileData>) => {
    const updated = await updateStudentProfile(patch)
    setProfile(updated)
    notifySuccess('Academic Certificate updated')
    trackStudentFunnel('student_profile_meter_click', { source: 'academic_certificate' })
  }

  const handleRankingLoaded = useCallback((rows: StudentRankingRow[]) => {
    if (rows.some((row) => row.isCurrentUser)) setRankingRows(rows)
  }, [])

  if (loading && !profile) {
    return (
      <div className="space-y-5 pb-page-bottom-cta">
        <div className="h-12 w-72 animate-pulse rounded-2xl bg-[var(--color-border)]" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="aspect-[3/2] animate-pulse rounded-[24px] bg-[var(--color-border)]" />
          <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7 pb-page-bottom-cta">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageTitle title={t('studentDashboardTitle', 'Student Home')} icon="LayoutDashboard" />
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            Build your academic profile and get discovered by universities.
          </p>
        </div>
        <RankingTrigger rows={rankingRows} onClick={() => setRankingOpen(true)} />
      </header>

      {profileError ? (
        <div className="rounded-[20px] border border-amber-500/25 bg-amber-500/8 p-4 text-sm text-[var(--color-text-muted)]" role="status">
          Your certificate could not refresh. Existing opportunities are still available while we reconnect.
        </div>
      ) : null}

      <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-card)] sm:p-6" data-onboarding="student-home-mission">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-accent">Your next milestone</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[var(--color-text)] sm:text-3xl">Complete your Academic Certificate</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">Complete your certificate to unlock university opportunities, scholarships and grants.</p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Academic Certificate</p>
            <p className="mt-1 text-2xl font-semibold text-primary-accent">{certificateCompletion}% complete</p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <AcademicCertificate profile={profile} onFieldClick={setEditorField} />
          <aside className="flex flex-col gap-4">
            <StudentBadge
              level={levelState.level}
              nextLevel={levelState.nextLevel}
              progressPercent={levelState.progressPercent}
              nextMilestone={levelState.nextMilestone}
            />

            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)]/75 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                <Sparkles className="h-4.5 w-4.5 text-primary-accent" aria-hidden /> Why this matters
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">Universities use your Academic Certificate to discover you and send relevant offers, scholarships and grants.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Link to="/student/interests" className="rounded-2xl bg-[var(--color-card)] p-3 text-center transition-colors hover:bg-primary-accent/8">
                  <span className="block text-xl font-semibold text-[var(--color-text)]">{activeApplications.length}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Interests</span>
                </Link>
                <Link to="/student/offers" className="rounded-2xl bg-[var(--color-card)] p-3 text-center transition-colors hover:bg-primary-accent/8">
                  <span className="block text-xl font-semibold text-[var(--color-text)]">{offers.length}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Offers</span>
                </Link>
                <Link to="/student/documents" className="rounded-2xl bg-[var(--color-card)] p-3 text-center transition-colors hover:bg-primary-accent/8">
                  <span className="block text-xl font-semibold text-[var(--color-text)]">{docCount}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Documents</span>
                </Link>
              </div>
            </div>

            <Button type="button" size="lg" className="w-full" onClick={() => setEditorField(nextCertificateField(profile))}>
              Continue my certificate <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button to="/student/profile" variant="secondary" className="w-full">Open full academic profile</Button>
          </aside>
        </div>
      </section>

      <section aria-label="How Edmission works" className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-4 sm:px-6">
        <ol className="grid gap-2 sm:grid-cols-4">
          {JOURNEY_STEPS.map((step, index) => {
            const Icon = step.icon
            const complete = index === 0 ? certificateCompletion >= 100 : index === 1 ? certificateCompletion >= 75 : index === 2 ? offers.length > 0 : applications.some((application) => application.status === 'accepted')
            return (
              <li key={step.label} className="relative flex items-center gap-3 rounded-2xl px-2 py-2.5">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', complete ? 'bg-green-500/14 text-green-600 dark:text-green-400' : index === 0 ? 'bg-primary-accent/14 text-primary-accent' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]')}>
                  {complete ? <CheckCircle2 className="h-4.5 w-4.5" aria-hidden /> : <Icon className="h-4.5 w-4.5" aria-hidden />}
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Step {index + 1}</span>
                  <span className="block text-sm font-medium text-[var(--color-text)]">{step.label}</span>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-accent">Matched to your story</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">University opportunities</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">The stronger your certificate becomes, the more relevant these matches can be.</p>
          </div>
          <Button to="/student/universities" variant="secondary" size="sm">Explore all universities</Button>
        </div>
        {recommendationsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : recommendations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((university, index) => (
              <div key={university.id} className="animate-card-enter opacity-0" style={{ animationDelay: `${index * 0.06}s`, animationFillMode: 'forwards' }}>
                <UniversityCard university={university} showRequirements={false} onInterest={() => {}} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-7 text-center">
            <Building2 className="mx-auto h-7 w-7 text-primary-accent" aria-hidden />
            <h3 className="mt-3 font-semibold text-[var(--color-text)]">Your matches are getting ready</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">Add the key certificate details and we’ll use them to find universities that fit your goals.</p>
            <Button to="/student/universities" className="mt-4">Explore universities</Button>
          </div>
        )}
      </section>

      {(digest.length > 0 || activeApplications.length > 0 || offers.length > 0) ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {digest.length > 0 ? (
            <Card className="p-5">
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary-accent" aria-hidden /> Recent updates</CardTitle>
              <ul className="mt-3 space-y-1">
                {digest.map((item) => (
                  <li key={item.id}>
                    {item.link ? <Link to={item.link} className="group flex min-h-[44px] items-center justify-between rounded-xl px-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"><span className="truncate">{item.title}</span><ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden /></Link> : <span className="block px-2 py-3 text-sm text-[var(--color-text-muted)]">{item.title}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {(activeApplications.length > 0 || offers.length > 0) ? (
            <Card className="p-5">
              <CardTitle>Your opportunity momentum</CardTitle>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">You’re one step closer to your first university offer.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/student/interests" className="rounded-[18px] border border-[var(--color-border)] p-4 transition-colors hover:border-primary-accent/40"><p className="text-2xl font-semibold text-[var(--color-text)]">{activeApplications.length}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">Active interests</p></Link>
                <Link to="/student/offers" className="rounded-[18px] border border-[var(--color-border)] p-4 transition-colors hover:border-primary-accent/40"><p className="text-2xl font-semibold text-[var(--color-text)]">{offers.length}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">Offers received</p></Link>
              </div>
            </Card>
          ) : null}
        </section>
      ) : null}

      <StudentRankingSheet open={rankingOpen} onClose={() => setRankingOpen(false)} onLoaded={handleRankingLoaded} />
      <CertificateEditorModal field={editorField} profile={profile} onClose={() => setEditorField(null)} onSave={saveCertificateField} />
    </div>
  )
}
