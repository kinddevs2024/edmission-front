import { useEffect, useState } from 'react'
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
import { CheckCircle, Circle } from 'lucide-react'

export function StudentDashboard() {
  const [profilePercent, setProfilePercent] = useState(0)
  const [applications, setApplications] = useState<Application[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [recommendations, setRecommendations] = useState<UniversityListItem[]>([])
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [docCount, setDocCount] = useState(0)

  useEffect(() => {
    getApplications({ limit: 100 }).then((r) => setApplications(r.data ?? [])).catch(() => {})
    getOffers({ limit: 100 }).then((r) => setOffers(r.data ?? [])).catch(() => {})
    getMyDocuments().then((d) => setDocCount(d.length)).catch(() => {})
    getStudentProfile()
      .then((p) => setProfilePercent(p.portfolioCompletionPercent ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingRecs(true)
    getRecommendations({ limit: 5 })
      .then((recs) => {
        if (cancelled || !recs.data?.length) return
        const ids = recs.data.map((r) => r.universityId).slice(0, 5)
        return getCompareUniversities(ids)
      })
      .then((list) => {
        if (cancelled || !list?.length) return
        setRecommendations(list.map((u) => ({
          ...u,
          name: u.name ?? (u as unknown as { universityName?: string }).universityName ?? '',
        })))
      })
      .catch(() => setRecommendations([]))
      .finally(() => { if (!cancelled) setLoadingRecs(false) })
    return () => { cancelled = true }
  }, [])

  const activeApplications = applications.filter((a) => !['rejected', 'accepted'].includes(a.status))
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length
  const onboardingSteps = [
    { label: 'Complete your profile', to: '/student/profile', done: profilePercent >= 80 },
    { label: 'Upload a document', to: '/student/documents', done: docCount > 0 },
    { label: 'Apply to a university', to: '/student/universities', done: applications.length > 0 },
  ]
  const onboardingDone = onboardingSteps.every((s) => s.done)

  return (
    <div className="space-y-6">
      <PageTitle title="Student Dashboard" icon="LayoutDashboard" />

      {!onboardingDone && (
        <Card className="border-primary-accent/30">
          <CardTitle>Get started</CardTitle>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Complete these steps to get the most out of Edmission.</p>
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
        <Card className="animate-card-enter">
          <CardTitle>Profile completion</CardTitle>
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
        <Card className="animate-card-enter animate-stagger-1">
          <CardTitle>Active applications</CardTitle>
          <p className="text-2xl font-semibold">{activeApplications.length}</p>
        </Card>
        <Card className="animate-card-enter animate-stagger-2">
          <CardTitle>Offers</CardTitle>
          <p className="text-2xl font-semibold">{offers.length}</p>
        </Card>
        <Card className="animate-card-enter animate-stagger-3">
          <CardTitle>Accepted</CardTitle>
          <p className="text-2xl font-semibold">{acceptedCount}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Recommended universities</CardTitle>
        {loadingRecs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {recommendations.slice(0, 5).map((u) => (
              <UniversityCard key={u.id} university={u} showMatch onInterest={() => {}} />
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] mt-2">Complete your profile to get recommendations.</p>
        )}
        <Button to="/student/universities" className="mt-4">Explore universities</Button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Active applications</CardTitle>
          {activeApplications.length === 0 ? (
            <p className="text-[var(--color-text-muted)]">No active applications.</p>
          ) : (
            <ul className="space-y-2">
              {activeApplications.slice(0, 5).map((a) => (
                <li key={a.id} className="flex justify-between items-center">
                  <span>{a.universityName ?? a.universityId}</span>
                  <span className="text-sm text-[var(--color-text-muted)]">{a.status}</span>
                  <Button to={`/student/applications`} variant="ghost" size="sm">View</Button>
                </li>
              ))}
            </ul>
          )}
          <Button to="/student/applications" variant="secondary" className="mt-3">All applications</Button>
        </Card>
        <Card>
          <CardTitle>Recent offers</CardTitle>
          {offers.length === 0 ? (
            <p className="text-[var(--color-text-muted)]">No offers yet.</p>
          ) : (
            <ul className="space-y-2">
              {offers.slice(0, 3).map((o) => (
                <li key={o.id} className="flex justify-between items-center">
                  <span>{o.universityName ?? o.universityId}</span>
                  <Button to="/student/offers" variant="ghost" size="sm">View</Button>
                </li>
              ))}
            </ul>
          )}
          <Button to="/student/offers" variant="secondary" className="mt-3">All offers</Button>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button to="/student/universities">Explore universities</Button>
        <Button to="/student/applications" variant="secondary">My applications</Button>
        <Button to="/student/chat" variant="ghost">Chats</Button>
      </div>
    </div>
  )
}
