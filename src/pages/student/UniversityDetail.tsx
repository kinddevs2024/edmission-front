import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { Badge } from '@/components/ui/Badge'
import { MatchScore } from '@/components/student/MatchScore'
import { api } from '@/services/api'
import { showInterest, getApplications, getInterestLimit } from '@/services/student'
import { getImageUrl } from '@/services/upload'
import { toastApiError } from '@/utils/toastError'
import { getLocalizedCountryName, getLocalizedLanguageName } from '@/utils/localeDisplay'
import { MessageCircle } from 'lucide-react'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import type { UniversityProfile, Program, Scholarship, Faculty } from '@/types/university'
import { notifySuccess } from '@/utils/notify'
export function UniversityDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation(['common', 'student', 'university'])
  const [uni, setUni] = useState<UniversityProfile | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [matchBreakdown, setMatchBreakdown] = useState<Record<string, number> | null>(null)
  const [interested, setInterested] = useState(false)
  const [interestLimit, setInterestLimit] = useState<{ allowed: boolean; limit: number | null }>({ allowed: true, limit: 3 })
  const [loading, setLoading] = useState(true)

  const formatDegree = (value?: string | null) => {
    if (!value) return ''
    const normalized = value.toLowerCase()
    if (normalized === 'bachelor') return t('student:degreeBachelor', 'Bachelor')
    if (normalized === 'master') return t('student:degreeMaster', 'Master')
    if (normalized === 'phd') return t('student:degreePhd', 'PhD')
    if (normalized === 'foundation') return t('student:degreeFoundation', 'Foundation')
    if (normalized === 'associate') return t('student:degreeAssociate', 'Associate')
    return value
  }

  useEffect(() => {
    getApplications({ limit: 500 }).then((res) => {
      const hasId = (res.data ?? []).some((a) => (a as { universityId?: string }).universityId === id)
      setInterested(hasId)
    }).catch(toastApiError)
    getInterestLimit().then((l) => setInterestLimit({ allowed: l.allowed, limit: l.limit })).catch(toastApiError)
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    api.get<UniversityProfile & { programs?: Program[]; scholarships?: Scholarship[]; faculties?: Faculty[]; matchScore?: number; breakdown?: Record<string, number> }>(`/student/universities/${id}`)
      .then((res) => {
        if (cancelled) return
        const u = res.data
        setUni(u)
        setPrograms(u.programs ?? [])
        setScholarships(u.scholarships ?? [])
        setFaculties(u.faculties ?? [])
        if (u.matchScore != null) {
          setMatchScore(u.matchScore)
          setMatchBreakdown(u.breakdown ?? null)
        }
      })
      .catch((e) => {
        if (!cancelled) { toastApiError(e); setUni(null) }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const handleInterest = () => {
    if (!id || interested || !interestLimit.allowed) return
    showInterest(id)
      .then(() => {
        setInterested(true)
        notifySuccess(t('student:interestedButton', 'Interested'))
      })
      .catch(toastApiError)
  }

  if (loading && !uni) {
    return (
      <div className="space-y-4">
        <BackLink to="/student/universities">{t('common:backToList', 'Back to list')}</BackLink>
        <Card><div className="h-8 w-48 rounded bg-[var(--color-border)] animate-pulse" /></Card>
      </div>
    )
  }

  if (!uni) {
    return (
      <div className="space-y-4">
        <BackLink to="/student/universities">{t('common:backToList', 'Back to list')}</BackLink>
        <Card><p className="text-[var(--color-text-muted)]">University not found.</p></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink to="/student/universities">{t('common:backToList', 'Back to list')}</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {(uni.logo ?? (uni as { logoUrl?: string }).logoUrl) ? (
            <img src={getImageUrl((uni as { logo?: string; logoUrl?: string }).logo ?? (uni as { logoUrl?: string }).logoUrl)} alt="" loading="lazy" className="w-20 h-20 rounded-card object-contain bg-[var(--color-border)]/30 p-1" />
          ) : (
            <div className="w-20 h-20 rounded-card bg-[var(--color-border)]" />
          )}
          <div>
            <h1 className="text-h1">{uni.name}</h1>
            <p className="text-[var(--color-text-muted)]">
              {[uni.country ? getLocalizedCountryName(uni.country, i18n.language) : '', uni.city].filter(Boolean).join(' · ')}
              {uni.rating != null && ` · ${t('student:compareRating', 'Rating')} ${uni.rating}`}
            </p>
            {(uni.slogan ?? (uni as { tagline?: string }).tagline) && (
              <p className="text-sm mt-1 text-[var(--color-text-muted)]">
                {uni.slogan ?? (uni as { tagline?: string }).tagline}
              </p>
            )}
          </div>
        </div>
        {matchScore != null && (
          <MatchScore score={matchScore} breakdown={matchBreakdown ?? undefined} variant="circle" size="md" />
        )}
      </div>

      <Card>
        <CardTitle>{t('common:overview', 'Overview')}</CardTitle>
        <p className="text-[var(--color-text-muted)] whitespace-pre-wrap">{uni.description ?? 'No description.'}</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {(uni.foundedYear ?? (uni as { establishedYear?: number }).establishedYear) != null && (
            <div><span className="text-[var(--color-text-muted)]">{t('university:establishedYear', 'Founded')}:</span> {uni.foundedYear ?? (uni as { establishedYear?: number }).establishedYear}</div>
          )}
          {uni.studentCount != null && (
            <div><span className="text-[var(--color-text-muted)]">{t('university:studentCount', 'Students')}:</span> {uni.studentCount.toLocaleString()}</div>
          )}
          {uni.accreditation && (
            <div><span className="text-[var(--color-text-muted)]">{t('university:accreditation', 'Accreditation')}:</span> {uni.accreditation}</div>
          )}
          {uni.minLanguageLevel && (
            <div><span className="text-[var(--color-text-muted)]">{t('university:minRequirements', 'Min. requirements')}:</span> {uni.minLanguageLevel}</div>
          )}
          {uni.tuitionPrice != null && (
            <div><span className="text-[var(--color-text-muted)]">{t('university:tuitionPrice', 'Tuition')}:</span> {uni.tuitionPrice === 0 ? 'Free' : `${uni.tuitionPrice.toLocaleString()} /yr`}</div>
          )}
        </div>
      </Card>

      {((uni.targetStudentCountries ?? []) as string[]).length > 0 && (
        <Card>
          <CardTitle>{t('university:targetStudentCountries', 'Target student countries')}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {(uni.targetStudentCountries ?? []).map((code: string) => (
              <Badge key={code} variant="info">{getLocalizedCountryName(code, i18n.language)}</Badge>
            ))}
          </div>
        </Card>
      )}

      {((uni.facultyCodes ?? []) as string[]).length > 0 && (
        <Card>
          <CardTitle>{t('university:facultiesListTitle', 'Fields of study')}</CardTitle>
          <div className="space-y-3">
            {(uni.facultyCodes ?? []).map((code: string) => {
              const cat = FIELD_OF_STUDY.find((c) => c.id === code)
              const items = (uni.facultyItems ?? {})[code] ?? cat?.items ?? []
              return (
                <div key={code} className="border-b border-[var(--color-border)] last:border-0 pb-3 last:pb-0">
                  <p className="font-medium text-[var(--color-text)]">{cat ? t(cat.titleKey) : code}</p>
                  {Array.isArray(items) && items.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {items.map((item) => (
                        <Badge key={item} variant="default" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {programs.length > 0 && (
        <Card>
          <CardTitle>Programs</CardTitle>
          <ul className="space-y-2">
            {programs.map((program) => (
              <li key={program.id} className="flex items-center justify-between">
                <span>{formatDegree(program.degree)} - {program.field}</span>
                {program.tuition != null ? <span>{program.tuition}</span> : null}
                {program.language ? <Badge variant="info">{getLocalizedLanguageName(program.language, i18n.language)}</Badge> : null}
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

      {faculties.length > 0 && (
        <Card>
          <CardTitle>Faculties</CardTitle>
          <ul className="space-y-4">
            {faculties.map((f) => (
              <li key={f.id} className="border-b border-[var(--color-border)] last:border-0 pb-4 last:pb-0 first:pt-0 pt-4 first:pt-0">
                <h3 className="font-medium text-[var(--color-text)]">{f.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1 whitespace-pre-wrap">{f.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleInterest} disabled={interested || !interestLimit.allowed}>
          {interested ? t('student:interestedButton') : !interestLimit.allowed ? t('student:interestLimitReached') : t('student:showInterest')}
        </Button>
        <Button to={`/student/chat?universityId=${encodeURIComponent(id ?? '')}`} variant="secondary" icon={<MessageCircle size={16} />}>{t('common:messageButton')}</Button>
        <Button to="/student/compare" variant="ghost">{t('common:addToCompare')}</Button>
      </div>
    </div>
  )
}
