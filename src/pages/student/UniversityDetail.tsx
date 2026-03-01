import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MatchScore } from '@/components/student/MatchScore'
import { api } from '@/services/api'
import { showInterest, getApplications, getInterestLimit } from '@/services/student'
import { getImageUrl } from '@/services/upload'
import { MessageCircle } from 'lucide-react'
import type { UniversityProfile, Program, Scholarship } from '@/types/university'

export function UniversityDetail() {
  const { id } = useParams<{ id: string }>()
  const [uni, setUni] = useState<UniversityProfile | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [matchBreakdown, setMatchBreakdown] = useState<Record<string, number> | null>(null)
  const [interested, setInterested] = useState(false)
  const [interestLimit, setInterestLimit] = useState<{ allowed: boolean; limit: number | null }>({ allowed: true, limit: 3 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApplications({ limit: 500 }).then((res) => {
      const hasId = (res.data ?? []).some((a) => (a as { universityId?: string }).universityId === id)
      setInterested(hasId)
    }).catch(() => {})
    getInterestLimit().then((l) => setInterestLimit({ allowed: l.allowed, limit: l.limit })).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    api.get<UniversityProfile & { programs?: Program[]; scholarships?: Scholarship[]; matchScore?: number; breakdown?: Record<string, number> }>(`/student/universities/${id}`)
      .then((res) => {
        if (cancelled) return
        const u = res.data
        setUni(u)
        setPrograms(u.programs ?? [])
        setScholarships(u.scholarships ?? [])
        if (u.matchScore != null) {
          setMatchScore(u.matchScore)
          setMatchBreakdown(u.breakdown ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) setUni(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const handleInterest = () => {
    if (!id || interested || !interestLimit.allowed) return
    showInterest(id).then(() => setInterested(true)).catch(() => {})
  }

  if (loading && !uni) {
    return (
      <div className="space-y-4">
        <Link to="/student/universities" className="text-primary-accent hover:underline">← Back to list</Link>
        <Card><div className="h-8 w-48 rounded bg-[var(--color-border)] animate-pulse" /></Card>
      </div>
    )
  }

  if (!uni) {
    return (
      <div className="space-y-4">
        <Link to="/student/universities" className="text-primary-accent hover:underline">← Back to list</Link>
        <Card><p className="text-[var(--color-text-muted)]">University not found.</p></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/student/universities" className="text-primary-accent hover:underline">← Back to list</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {uni.logo ? (
            <img src={getImageUrl(uni.logo)} alt="" className="w-20 h-20 rounded-card object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-card bg-[var(--color-border)]" />
          )}
          <div>
            <h1 className="text-h1">{uni.name}</h1>
            <p className="text-[var(--color-text-muted)]">
              {[uni.country, uni.city].filter(Boolean).join(' · ')}
              {uni.rating != null && ` · Rating ${uni.rating}`}
            </p>
            {uni.slogan && <p className="text-sm mt-1">{uni.slogan}</p>}
          </div>
        </div>
        {matchScore != null && (
          <MatchScore score={matchScore} breakdown={matchBreakdown ?? undefined} variant="circle" size="md" />
        )}
      </div>

      <Card>
        <CardTitle>Overview</CardTitle>
        <p className="text-[var(--color-text-muted)] whitespace-pre-wrap">{uni.description ?? 'No description.'}</p>
        {uni.foundedYear && <p className="mt-2 text-sm">Founded: {uni.foundedYear}</p>}
        {uni.studentCount != null && <p className="text-sm">Students: {uni.studentCount}</p>}
        {uni.accreditation && <p className="text-sm">Accreditation: {uni.accreditation}</p>}
      </Card>

      {programs.length > 0 && (
        <Card>
          <CardTitle>Programs</CardTitle>
          <ul className="space-y-2">
            {programs.map((p) => (
              <li key={p.id} className="flex justify-between items-center">
                <span>{p.degree} — {p.field}</span>
                {p.tuition != null && <span>{p.tuition}</span>}
                {p.language && <Badge variant="info">{p.language}</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {scholarships.length > 0 && (
        <Card>
          <CardTitle>Scholarships</CardTitle>
          <ul className="space-y-2">
            {scholarships.map((s) => (
              <li key={s.id} className="flex justify-between items-center">
                <span>{s.name}</span>
                <Badge variant="success">{s.coveragePercent}% · {s.remainingSlots ?? (s.maxSlots - (s.usedSlots ?? 0))} left</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleInterest} disabled={interested || !interestLimit.allowed}>
          {interested ? 'Interested' : !interestLimit.allowed ? 'Interest limit reached' : 'Show interest'}
        </Button>
        <Button to={`/student/chat?universityId=${encodeURIComponent(id ?? '')}`} variant="secondary" icon={<MessageCircle size={16} />}>Message</Button>
        <Button to="/student/compare" variant="ghost">Add to compare</Button>
      </div>
    </div>
  )
}
