import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { PageTitle } from '@/components/ui/PageTitle'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import { getStudentProfile, type FullStudentProfile } from '@/services/university'
import { getApiError } from '@/services/api'
import { getStudentAvatarUrl } from '@/services/upload'
import { formatDate } from '@/utils/format'
import { MessageCircle, FileText, ExternalLink, Lock, Percent } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getStudentDisplayName } from '@/utils/studentDisplay'

export function UniversityStudentProfile() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['common', 'university'])
  const [profile, setProfile] = useState<FullStudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filePreview, setFilePreview] = useState<NonNullable<FullStudentProfile['documents']>[number] | null>(null)

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    setError('')
    getStudentProfile(studentId)
      .then(setProfile)
      .catch((e) => {
        const err = getApiError(e)
        if ((err as { code?: string }).code === 'FORBIDDEN') {
          setError('You have reached the maximum number of student profiles for your current plan. Please upgrade your subscription to view more students.')
        } else {
          setError('Failed to load profile')
        }
      })
      .finally(() => setLoading(false))
  }, [studentId])

  if (!studentId) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate(-1)}>{t('common:back')}</BackLink>
        <p className="text-[var(--color-text-muted)]">{t('university:invalidStudent', 'Invalid student.')}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate(-1)}>{t('common:back')}</BackLink>
        <p className="text-[var(--color-text-muted)]">{t('common:loading')}</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate(-1)}>{t('common:back')}</BackLink>
        <p className="text-red-500">{error || t('university:studentNotFound', 'Student not found.')}</p>
      </div>
    )
  }

  const isPrivate = profile.profileVisibility === 'private'
  const name = isPrivate
    ? t('university:privateStudentPageTitle', 'Private student profile')
    : getStudentDisplayName(profile, t('university:studentLabel'))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink onClick={() => navigate(-1)}>{t('common:back')}</BackLink>
        <Button to={`/university/chat?studentId=${encodeURIComponent(profile.id)}`} size="sm" icon={<MessageCircle size={16} />}>
          {t('university:navChat')}
        </Button>
      </div>

      <PageTitle title={name} icon="User" />

      {isPrivate ? (
        <div className="rounded-card border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--color-text)] flex gap-2 items-start">
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden />
          <p>{t('university:privateProfileBanner')}</p>
        </div>
      ) : null}

      {profile.peerScholarships && profile.peerScholarships.length > 0 ? (
        <Card className="border-primary-accent/25 bg-[var(--color-bg-muted)]/40">
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary-accent shrink-0" aria-hidden />
            {t('university:peerScholarshipsSectionTitle', 'Scholarships from other universities')}
          </CardTitle>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t(
              'university:peerScholarshipsSectionIntro',
              'This student received scholarship offers elsewhere. Only the city and coverage percentage are shown — not the institution name.'
            )}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {profile.peerScholarships.map((row, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
              >
                <span className="text-[var(--color-text-muted)]">{t('university:city', 'City')}:</span>
                <span className="font-medium">{row.city?.trim() ? row.city : t('university:peerScholarshipsCityUnknown', '—')}</span>
                <span className="text-[var(--color-text-muted)]">{t('university:coveragePercent', 'Coverage %')}:</span>
                <span className="font-medium tabular-nums">{row.coveragePercent}%</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className={cn('grid gap-6', 'md:grid-cols-[minmax(0,340px)_1fr]')}>
        <div className="space-y-4">
          {profile.readiness && (
            <Card className="border-primary-accent/20">
              <CardTitle>Readiness for university</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={profile.readiness.profile ? 'text-green-600 dark:text-green-400' : 'text-[var(--color-text-muted)]'}>
                  {profile.readiness.profile ? '✓' : '○'} Profile (country, city)
                </span>
                <span className={profile.readiness.education ? 'text-green-600 dark:text-green-400' : 'text-[var(--color-text-muted)]'}>
                  {profile.readiness.education ? '✓' : '○'} Education (grades)
                </span>
                <span className={profile.readiness.certificates ? 'text-green-600 dark:text-green-400' : 'text-[var(--color-text-muted)]'}>
                  {profile.readiness.certificates ? '✓' : '○'} Certificates
                </span>
                {profile.readiness.ready && (
                  <span className="font-medium text-primary-accent">Ready</span>
                )}
              </div>
            </Card>
          )}
          <div className="flex justify-center md:justify-start">
            {isPrivate ? (
              <div className="w-24 h-24 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] flex items-center justify-center" aria-hidden>
                <Lock className="w-10 h-10 text-[var(--color-text-muted)]" />
              </div>
            ) : (
              <img src={getStudentAvatarUrl(profile.avatarUrl)} alt="" loading="lazy" className="w-24 h-24 rounded-full object-cover border border-[var(--color-border)]" />
            )}
          </div>

              <Card>
            <CardTitle>Personal</CardTitle>
            {isPrivate ? (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('university:personalHiddenForPrivacy')}</p>
            ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
              <dt className="text-[var(--color-text-muted)]">First name</dt><dd>{profile.firstName ?? '—'}</dd>
              <dt className="text-[var(--color-text-muted)]">Last name</dt><dd>{profile.lastName ?? '—'}</dd>
              <dt className="text-[var(--color-text-muted)]">Email</dt><dd>{profile.email ?? '—'}</dd>
              <dt className="text-[var(--color-text-muted)]">Date of birth</dt><dd>{profile.birthDate ? formatDate(profile.birthDate) : '—'}</dd>
            </dl>
            )}
          </Card>

          <Card>
            <CardTitle>Location</CardTitle>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
              <dt className="text-[var(--color-text-muted)]">Country</dt><dd>{profile.country ?? '—'}</dd>
              <dt className="text-[var(--color-text-muted)]">City</dt><dd>{profile.city ?? '—'}</dd>
            </dl>
          </Card>

          {profile.budgetAmount != null && Number(profile.budgetAmount) >= 0 && (
            <Card>
              <CardTitle>{t('university:budgetLabel', 'Budget for studies')}</CardTitle>
              <p className="mt-2 text-sm">
                {Number(profile.budgetAmount).toLocaleString()} {profile.budgetCurrency ?? 'USD'}
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
      <Card>
        <CardTitle>Education</CardTitle>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
          {(profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd') && (
            <><dt className="text-[var(--color-text-muted)]">Applying for</dt><dd>{profile.targetDegreeLevel === 'master' ? 'Master' : 'PhD'}</dd></>
          )}
          <dt className="text-[var(--color-text-muted)]">Grade / level</dt><dd>{profile.gradeLevel ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">GPA</dt><dd>{profile.gpa != null ? profile.gpa : '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">{profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd' ? 'University completed' : 'School completed'}</dt><dd>{profile.schoolCompleted != null ? (profile.schoolCompleted ? 'Yes' : 'No') : '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">{profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd' ? 'University / Institution name' : 'School name'}</dt><dd>{profile.schoolName ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">Graduation year</dt><dd>{profile.graduationYear ?? '—'}</dd>
          {profile.gradingScheme && <><dt className="text-[var(--color-text-muted)]">Grading scheme</dt><dd>{profile.gradingScheme}</dd></>}
          {profile.gradeScale != null && <><dt className="text-[var(--color-text-muted)]">Grade scale (out of)</dt><dd>{profile.gradeScale}</dd></>}
          {profile.highestEducationLevel && <><dt className="text-[var(--color-text-muted)]">Highest education level</dt><dd>{profile.highestEducationLevel}</dd></>}
        </dl>
        {profile.schoolsAttended?.length ? (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <p className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Schools / Universities attended</p>
            <ul className="space-y-2">
              {profile.schoolsAttended.map((s, i) => (
                <li key={i} className="text-sm">
                  {s.institutionName ?? '—'} {s.country && `(${s.country})`} {s.attendedFrom && s.attendedTo && ` · ${s.attendedFrom.slice(0, 4)}–${s.attendedTo.slice(0, 4)}`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Languages</CardTitle>
        <div className="mt-2 text-sm">
          {profile.languageLevel && <p><span className="text-[var(--color-text-muted)]">Level: </span>{profile.languageLevel}</p>}
          {profile.languages?.length ? (
            <ul className="list-disc list-inside mt-1">
              {profile.languages.map((l, i) => (
                <li key={i}>{l.language} — {l.level}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--color-text-muted)]">—</p>
          )}
        </div>
      </Card>

      {profile.bio && (
        <Card>
          <CardTitle>About</CardTitle>
          <p className="mt-2 text-sm whitespace-pre-wrap">{profile.bio}</p>
        </Card>
      )}

      <Card>
        <CardTitle>Skills</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.skills?.length ? profile.skills.map((s, i) => (
            <span key={i} className="px-2 py-1 rounded-full bg-[var(--color-bg-muted)] text-sm">{s}</span>
          )) : <p className="text-sm text-[var(--color-text-muted)]">—</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>Interests</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.interests?.length ? profile.interests.map((s, i) => (
            <span key={i} className="px-2 py-1 rounded-full bg-[var(--color-bg-muted)] text-sm">{s}</span>
          )) : <p className="text-sm text-[var(--color-text-muted)]">—</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>Hobbies</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.hobbies?.length ? profile.hobbies.map((s, i) => (
            <span key={i} className="px-2 py-1 rounded-full bg-[var(--color-bg-muted)] text-sm">{s}</span>
          )) : <p className="text-sm text-[var(--color-text-muted)]">—</p>}
        </div>
      </Card>

      {profile.experiences?.length ? (
        <Card>
          <CardTitle>Experience</CardTitle>
          <ul className="mt-2 space-y-3">
            {profile.experiences.map((e, i) => (
              <li key={i} className="text-sm border-b border-[var(--color-border)] pb-2 last:border-0">
                <p className="font-medium">{e.title ?? e.type}</p>
                {e.organization && <p className="text-[var(--color-text-muted)]">{e.organization}</p>}
                {(e.startDate || e.endDate) && (
                  <p className="text-[var(--color-text-muted)]">
                    {e.startDate ? formatDate(e.startDate) : '?'} — {e.endDate ? formatDate(e.endDate) : 'Present'}
                  </p>
                )}
                {e.description && <p className="mt-1">{e.description}</p>}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {profile.portfolioWorks?.length ? (
        <Card>
          <CardTitle>Portfolio / works</CardTitle>
          <ul className="mt-2 space-y-3">
            {profile.portfolioWorks.map((w, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">{w.title ?? 'Work'}</p>
                {w.description && <p className="text-[var(--color-text-muted)]">{w.description}</p>}
                {w.linkUrl && (
                  <a href={w.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-accent mt-1">
                    <ExternalLink size={14} /> Link
                  </a>
                )}
                {w.fileUrl && (
                  <a href={w.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-accent mt-1 ml-2">
                    <FileText size={14} /> File
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {profile.documents?.length ? (
        <Card>
          <CardTitle>Documents (approved)</CardTitle>
          <ul className="mt-2 space-y-2">
            {profile.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                <span className="font-medium">{d.name ?? d.type}</span>
                {d.certificateType && <span className="text-[var(--color-text-muted)]">{d.certificateType}</span>}
                {d.score && <span className="text-[var(--color-text-muted)]">Score: {d.score}</span>}
                <button
                  type="button"
                  onClick={() => setFilePreview(d)}
                  className="text-primary-accent hover:underline"
                >
                  Preview
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button to={`/university/chat?studentId=${encodeURIComponent(profile.id)}`} icon={<MessageCircle size={16} />}>
          {t('university:navChat')}
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>{t('common:backToList')}</Button>
      </div>

      <DocumentPreviewModal
        open={!!filePreview}
        onClose={() => setFilePreview(null)}
        title={filePreview?.name ?? filePreview?.type ?? 'Document'}
        document={filePreview ? {
          fileUrl: filePreview.fileUrl,
          canvasJson: filePreview.canvasJson,
          pageFormat: filePreview.pageFormat,
          width: filePreview.width,
          height: filePreview.height,
        } : null}
      />
    </div>
  )
}
