import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UniversityCard } from '@/components/student/UniversityCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { getApplications, getOffers, getRecommendations } from '@/services/student'
import { api } from '@/services/api'
import type { UniversityListItem } from '@/types/university'
import type { Application, Offer } from '@/types/student'

const MOCK_RECOMMENDATIONS: UniversityListItem[] = [
  { id: '1', name: 'Tech University', country: 'USA', city: 'Boston', description: 'Leading in CS and engineering.', matchScore: 92, hasScholarship: true },
  { id: '2', name: 'Global College', country: 'UK', city: 'London', description: 'International programs.', matchScore: 88, hasScholarship: true },
  { id: '3', name: 'Science Institute', country: 'Germany', city: 'Berlin', description: 'Research-focused.', matchScore: 85, hasScholarship: false },
]

export function StudentDashboard() {
  const [profilePercent] = useState(0)
  const [applications, setApplications] = useState<Application[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [recommendations, setRecommendations] = useState<UniversityListItem[]>([])
  const [loadingRecs, setLoadingRecs] = useState(true)

  useEffect(() => {
    getApplications({ limit: 100 }).then((r) => setApplications(r.data ?? [])).catch(() => {})
    getOffers({ limit: 100 }).then((r) => setOffers(r.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingRecs(true)
    getRecommendations({ limit: 5 })
      .then((recs) => {
        if (cancelled || !recs.data?.length) {
          setRecommendations(MOCK_RECOMMENDATIONS.slice(0, 5))
          setLoadingRecs(false)
          return
        }
        const ids = recs.data.map((r) => r.universityId)
        return api.get<{ data?: UniversityListItem[] }>('/universities', { params: { ids: ids.join(','), limit: 5 } })
          .then((res) => {
            if (cancelled) return
            const data = res.data?.data ?? []
            setRecommendations(
              data.map((u) => ({
                ...u,
                matchScore: recs.data?.find((r) => r.universityId === u.id)?.matchScore ?? u.matchScore,
                matchBreakdown: recs.data?.find((r) => r.universityId === u.id)?.breakdown,
              }))
            )
          })
          .catch(() => { if (!cancelled) setRecommendations(MOCK_RECOMMENDATIONS) })
          .finally(() => { if (!cancelled) setLoadingRecs(false) })
      })
      .catch(() => {
        if (!cancelled) {
          setRecommendations(MOCK_RECOMMENDATIONS)
          setLoadingRecs(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const activeApplications = applications.filter((a) => !['rejected', 'accepted'].includes(a.status))
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length

  return (
    <div className="space-y-6">
      <h1 className="text-h1">Student Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
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
        <Card>
          <CardTitle>Active applications</CardTitle>
          <p className="text-2xl font-semibold">{activeApplications.length}</p>
        </Card>
        <Card>
          <CardTitle>Offers</CardTitle>
          <p className="text-2xl font-semibold">{offers.length}</p>
        </Card>
        <Card>
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
