import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { Badge } from '@/components/ui/Badge'
import { AccountShareMenu } from '@/components/ui/AccountShareMenu'
import { MatchScore } from '@/components/student/MatchScore'
import { api } from '@/services/api'
import { showInterest, getApplications, getInterestLimit } from '@/services/student'
import { getImageUrl } from '@/services/upload'
import { toastApiError } from '@/utils/toastError'
import { getLocalizedCountryName, getLocalizedLanguageName } from '@/utils/localeDisplay'
import { MessageCircle } from 'lucide-react'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { getPublicUniversityFlyers } from '@/services/university'
import type { UniversityProfile, Program, Scholarship, Faculty, UniversityFlyer } from '@/types/university'
import { notifyError, notifySuccess } from '@/utils/notify'
import { getMyDocuments } from '@/services/studentDocuments'
import { getEffectiveIeltsMinBand } from '@/utils/admissionRequirements'
import { buildUniversityShareLink, shareAccountLink } from '@/utils/shareAccount'
export function UniversityDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation(['common', 'student', 'university'])
  const [uni, setUni] = useState<UniversityProfile | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [flyers, setFlyers] = useState<UniversityFlyer[]>([])
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [matchBreakdown, setMatchBreakdown] = useState<Record<string, number> | null>(null)
  const [interested, setInterested] = useState(false)
  const [interestLimit, setInterestLimit] = useState<{ allowed: boolean; limit: number | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof getMyDocuments>>>([])

  useEffect(() => {
    getMyDocuments()
      .then(setDocuments)
      .catch(() => setDocuments([]))
  }, [])

  const ieltsMinEffective = useMemo(
    () =>
      getEffectiveIeltsMinBand(
        (uni as unknown as { ieltsMinBand?: number })?.ieltsMinBand,
        uni?.minLanguageLevel
      ),
    [uni]
  )

  const hasIeltsCertificateUpload = useMemo(
    () =>
      documents.some(
        (d) =>
          d.type === 'language_certificate' &&
          !!d.fileUrl?.trim() &&
          /ielts/i.test(`${d.certificateType ?? ''} ${d.name ?? ''}`)
      ),
    [documents]
  )

  const interestBlockedByIelts =
    !interested && ieltsMinEffective != null && ieltsMinEffective > 0 && !hasIeltsCertificateUpload

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

  const getProgramDegree = (program: Program & { degreeLevel?: string }) =>
    program.degree ?? program.degreeLevel ?? ''

  const getProgramTuition = (program: Program & { tuitionFee?: number }) =>
    program.tuition ?? program.tuitionFee

  const formatScholarshipDeadline = (iso?: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(i18n.language)
  }

  useEffect(() => {
    const appUniversityId = uni?.id ?? id
    if (!appUniversityId) return
    getApplications({ limit: 500 }).then((res) => {
      const hasId = (res.data ?? []).some((a) => (a as { universityId?: string }).universityId === appUniversityId)
      setInterested(hasId)
    }).catch(toastApiError)
    getInterestLimit()
      .then((l) => setInterestLimit({ allowed: l.allowed, limit: l.limit }))
      .catch(() => setInterestLimit({ allowed: false, limit: 3 }))
  }, [id, uni?.id])

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
        const flyerUniversityId = String(u.id ?? id)
        getPublicUniversityFlyers(flyerUniversityId)
          .then((items) => {
            if (!cancelled) setFlyers(items)
          })
          .catch(() => {
            if (!cancelled) setFlyers([])
          })
      })
      .catch((e) => {
        if (!cancelled) { toastApiError(e); setUni(null) }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const interestLimitReady = interestLimit !== null
  const handleInterest = () => {
    if (!id || interested || !interestLimitReady || !interestLimit.allowed) return
    showInterest(id)
      .then(() => {
        setInterested(true)
        notifySuccess(t('student:interestedButton', 'Interested'))
        getInterestLimit()
          .then((l) => setInterestLimit({ allowed: l.allowed, limit: l.limit }))
          .catch(() => setInterestLimit({ allowed: false, limit: 3 }))
      })
      .catch(toastApiError)
  }

  const handleShareUniversity = async () => {
    const shareId = String(uni?.id ?? id ?? '').trim()
    if (!shareId) return
    const shareUrl = buildUniversityShareLink(shareId)
    const result = await shareAccountLink({
      title: uni?.name || t('university:profileTitle', 'University profile'),
      text: uni?.description || uni?.country || '',
      url: shareUrl,
    })
    if (result === 'copied') {
      notifySuccess(t('common:shareLinkCopied', 'Share link copied'))
      return
    }
    if (result === 'shared' || result === 'cancelled') return
    notifyError(t('common:shareFailed', 'Unable to share account right now.'))
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

      <div className="space-y-3">
        {(uni as { coverImage?: string; coverImageUrl?: string }).coverImageUrl ||
        (uni as { coverImage?: string; coverImageUrl?: string }).coverImage ? (
          <div className="w-full h-36 sm:h-48 lg:h-56 rounded-card overflow-hidden bg-[var(--color-border)]/40">
            <img
              src={getImageUrl(
                (uni as { coverImage?: string; coverImageUrl?: string }).coverImageUrl ??
                  (uni as { coverImage?: string; coverImageUrl?: string }).coverImage
              )}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

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
          <div className="ml-auto flex items-center gap-2">
            {matchScore != null && (
              <MatchScore score={matchScore} breakdown={matchBreakdown ?? undefined} variant="circle" size="md" />
            )}
            <AccountShareMenu onShare={handleShareUniversity} />
          </div>
        </div>
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
          <CardTitle>{t('university:facultyProgramsLabel', 'Programs')}</CardTitle>
          <ul className="space-y-3">
            {programs.map((program) => {
              const p = program as Program & { durationYears?: number; entryRequirements?: string }
              const degreeLabel = formatDegree(getProgramDegree(p))
              const fieldLabel = p.field?.trim() ?? ''
              const title =
                p.name?.trim() ||
                [degreeLabel, fieldLabel].filter(Boolean).join(' — ') ||
                t('documents:common.document', 'Program')
              const tuition = getProgramTuition(p)
              const durationYears = p.durationYears
              const durationLabel =
                durationYears != null && Number.isFinite(Number(durationYears))
                  ? t('student:programYears', '{{count}} yr', { count: Number(durationYears) })
                  : p.duration?.trim()
                    ? p.duration
                    : null

              return (
                <li
                  key={program.id}
                  className="rounded-card border border-[var(--color-border)] px-3 py-3 space-y-2"
                >
                  <div className="font-medium text-[var(--color-text)]">{title}</div>
                  {p.name?.trim() && (degreeLabel || fieldLabel) ? (
                    <div className="text-sm text-[var(--color-text-muted)]">
                      {[degreeLabel, fieldLabel].filter(Boolean).join(' · ')}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    {durationLabel ? (
                      <span>
                        {t('student:programDuration', 'Duration')}: {durationLabel}
                      </span>
                    ) : null}
                    {tuition != null && Number.isFinite(Number(tuition)) ? (
                      <span>
                        {t('university:tuitionPrice', 'Tuition')}: {Number(tuition).toLocaleString()}
                      </span>
                    ) : null}
                    {p.language ? (
                      <Badge variant="info">{getLocalizedLanguageName(p.language, i18n.language)}</Badge>
                    ) : null}
                  </div>
                  {p.entryRequirements?.trim() ? (
                    <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-wrap border-t border-[var(--color-border)] pt-2">
                      {p.entryRequirements}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {scholarships.length > 0 && (
        <Card>
          <CardTitle>{t('university:navScholarships', 'Scholarships')}</CardTitle>
          <ul className="space-y-3">
            {scholarships.map((s) => {
              const deadlineText = formatScholarshipDeadline(s.deadline ?? s.applicationDeadline)
              const cov = Number(s.coveragePercent)
              const slots = s.remainingSlots ?? (s.maxSlots != null ? s.maxSlots - (s.usedSlots ?? 0) : NaN)
              const covOk = Number.isFinite(cov)
              const slotsOk = Number.isFinite(slots)

              return (
                <li
                  key={s.id}
                  className="rounded-card border border-[var(--color-border)] px-3 py-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-[var(--color-text)]">{s.name}</span>
                    {deadlineText ? (
                      <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                        {t('student:scholarshipDeadline', 'Deadline')}: {deadlineText}
                      </span>
                    ) : null}
                    {s.eligibility?.trim() ? (
                      <p className="mt-2 text-sm text-[var(--color-text-muted)] whitespace-pre-wrap">{s.eligibility}</p>
                    ) : null}
                  </div>
                  {(covOk || slotsOk) && (
                    <Badge variant="success" className="shrink-0 self-start">
                      {[
                        covOk ? `${cov}%` : null,
                        slotsOk ? t('student:scholarshipSlotsLeft', '{{count}} left', { count: slots }) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Badge>
                  )}
                </li>
              )
            })}
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

      {flyers.length > 0 && (
        <Card>
          <CardTitle>{t('university:navFlyers', 'Flyers')}</CardTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {flyers.map((flyer) => {
              const mediaType = (flyer.mediaType ?? '').toLowerCase()
              const isImage = mediaType.startsWith('image/')
              const isVideo = mediaType.startsWith('video/')
              const editorPreview = flyer.previewImageUrl ? getImageUrl(flyer.previewImageUrl) : ''
              const mediaHref = flyer.mediaUrl ? getImageUrl(flyer.mediaUrl) : ''
              return (
                <div key={flyer.id} className="rounded-card border border-[var(--color-border)] p-3 space-y-2">
                  {flyer.title ? <h3 className="font-medium text-[var(--color-text)]">{flyer.title}</h3> : null}
                  {flyer.source === 'editor' && editorPreview ? (
                    <img
                      src={editorPreview}
                      alt={flyer.title ?? ''}
                      loading="lazy"
                      className="w-full max-h-72 rounded-card object-cover bg-[var(--color-border)]/30"
                    />
                  ) : isImage ? (
                    <img
                      src={mediaHref}
                      alt={flyer.title ?? ''}
                      loading="lazy"
                      className="w-full max-h-72 rounded-card object-cover bg-[var(--color-border)]/30"
                    />
                  ) : isVideo ? (
                    <video src={mediaHref} controls className="w-full max-h-72 rounded-card bg-black/80" />
                  ) : (
                    <a
                      href={mediaHref}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary-accent underline"
                    >
                      Open document
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {interestBlockedByIelts ? (
        <p className="text-sm text-amber-700 dark:text-amber-400/90 max-w-xl">
          {t(
            'student:interestBlockedIelts',
            'This university requires IELTS. Upload your IELTS certificate under Documents to show interest.'
          )}{' '}
          <Link to="/student/documents" className="font-medium text-primary-accent underline">
            {t('student:goToDocuments', 'Go to Documents')}
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 md:mb-2 md:pb-8">
        <Button
          onClick={handleInterest}
          disabled={interested || interestLimit === null || !interestLimit.allowed || interestBlockedByIelts}
        >
          {interested
            ? t('student:interestedButton')
            : interestLimit === null
              ? t('common:loading', 'Loading…')
              : !interestLimit.allowed
                ? t('student:interestLimitReached')
                : interestBlockedByIelts
                  ? t('student:interestNeedsIelts', 'Upload IELTS certificate')
                  : t('student:showInterest')}
        </Button>
        <Button to={`/student/chat?universityId=${encodeURIComponent(id ?? '')}`} variant="secondary" icon={<MessageCircle size={16} />}>{t('common:messageButton')}</Button>
        <Button to="/student/compare" variant="ghost">{t('common:addToCompare')}</Button>
      </div>
    </div>
  )
}
