import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { PageTitle } from '@/components/ui/PageTitle'
import { AccountShareMenu } from '@/components/ui/AccountShareMenu'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import { getStudentProfile, type FullStudentProfile } from '@/services/university'
import { getApiError } from '@/services/api'
import { getStudentAvatarUrl } from '@/services/upload'
import { formatDate } from '@/utils/format'
import { MessageCircle, FileText, ExternalLink, Lock, Percent } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getStudentDisplayName } from '@/utils/studentDisplay'
import { notifyError, notifySuccess } from '@/utils/notify'
import { buildStudentShareLink, shareAccountLink } from '@/utils/shareAccount'

export function UniversityStudentProfile() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['common', 'university', 'student'])
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
  const name = getStudentDisplayName(profile, t('university:studentLabel'))
  const documents = profile.documents ?? []

  const handleShareStudent = async () => {
    const shareUrl = buildStudentShareLink(profile.id)
    const result = await shareAccountLink({
      title: name || t('university:studentLabel', 'Student'),
      url: shareUrl,
    })
    if (result === 'copied') {
      notifySuccess(t('common:shareLinkCopied', 'Share link copied'))
      return
    }
    if (result === 'shared' || result === 'cancelled') return
    notifyError(t('common:shareFailed', 'Unable to share account right now.'))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <BackLink onClick={() => navigate(-1)}>{t('common:back')}</BackLink>
          <Button to={`/university/chat?studentId=${encodeURIComponent(profile.id)}`} size="sm" icon={<MessageCircle size={16} />}>
            {t('university:navChat')}
          </Button>
        </div>
        <AccountShareMenu onShare={handleShareStudent} />
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
              'This student received scholarship offers elsewhere. Only the city and coverage percentage are shown -- not the institution name.'
            )}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {profile.peerScholarships.map((row, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
              >
                <span className="text-[var(--color-text-muted)]">{t('university:city', 'City')}:</span>
                <span className="font-medium">{row.city?.trim() ? row.city : t('university:peerScholarshipsCityUnknown', '--')}</span>
                <span className="text-[var(--color-text-muted)]">{t('university:coveragePercent', 'Coverage %')}:</span>
                <span className="font-medium tabular-nums">{row.coveragePercent}%</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className={cn('grid gap-6', 'md:grid-cols-[minmax(0,340px)_1fr]')}>
        <div className="space-y-4">
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
            <CardTitle>{t('student:stepPersonal', 'Personal details')}</CardTitle>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
              <dt className="text-[var(--color-text-muted)]">{t('student:firstName', 'First name')}</dt><dd>{profile.firstName ?? '--'}</dd>
              {isPrivate ? null : (
                <>
                  <dt className="text-[var(--color-text-muted)]">{t('common:email', 'Email')}</dt>
                  <dd>
                    {profile.email ? (
                      <span
                        className="block max-w-full truncate cursor-text"
                        title={profile.email}
                      >
                        {profile.email}
                      </span>
                    ) : (
                      '--'
                    )}
                  </dd>
                  <dt className="text-[var(--color-text-muted)]">{t('student:birthDate', 'Date of birth')}</dt><dd>{profile.birthDate ? formatDate(profile.birthDate) : '--'}</dd>
                </>
              )}
            </dl>
          </Card>

          <Card>
            <CardTitle>{t('student:stepLocation', 'Location')}</CardTitle>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
              <dt className="text-[var(--color-text-muted)]">{t('student:country', 'Country')}</dt><dd>{profile.country ?? '--'}</dd>
              <dt className="text-[var(--color-text-muted)]">{t('student:city', 'City')}</dt><dd>{profile.city ?? '--'}</dd>
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
        <CardTitle>{t('student:stepEducation', 'Education')}</CardTitle>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
          {(profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd') && (
            <><dt className="text-[var(--color-text-muted)]">{t('student:applyingForDegree', 'Applying for degree')}</dt><dd>{profile.targetDegreeLevel === 'master' ? t('student:degreeMaster', 'Master') : t('student:degreePhd', 'PhD')}</dd></>
          )}
          <dt className="text-[var(--color-text-muted)]">{t('student:gradeLevel', 'Grade / education level')}</dt><dd>{profile.gradeLevel ?? '--'}</dd>
          <dt className="text-[var(--color-text-muted)]">{t('student:gpa', 'GPA (0–4)')}</dt><dd>{profile.gpa != null ? profile.gpa : '--'}</dd>
          <dt className="text-[var(--color-text-muted)]">
            {profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd'
              ? t('student:institutionCompleted', 'University completed')
              : t('student:schoolCompleted', 'School completed')}
          </dt><dd>{profile.schoolCompleted != null ? (profile.schoolCompleted ? t('common:yes', 'Yes') : t('common:no', 'No')) : '--'}</dd>
          {profile.schoolName?.trim() ? (
            <>
              <dt className="text-[var(--color-text-muted)]">
                {profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd'
                  ? t('student:institutionName', 'University / Institution name')
                  : t('student:schoolName', 'School name')}
              </dt>
              <dd>{profile.schoolName}</dd>
            </>
          ) : null}
          <dt className="text-[var(--color-text-muted)]">{t('student:graduationYear', 'Graduation year')}</dt><dd>{profile.graduationYear ?? '--'}</dd>
          {profile.gradingScheme && <><dt className="text-[var(--color-text-muted)]">{t('student:gradingScheme', 'Grading scheme')}</dt><dd>{profile.gradingScheme}</dd></>}
          {profile.gradeScale != null && <><dt className="text-[var(--color-text-muted)]">{t('student:gradeScaleOutOf', 'Grade scale (out of)')}</dt><dd>{profile.gradeScale}</dd></>}
          {profile.highestEducationLevel && <><dt className="text-[var(--color-text-muted)]">{t('student:highestLevelOfEducation', 'Highest level of education')}</dt><dd>{profile.highestEducationLevel}</dd></>}
        </dl>
        {profile.schoolsAttended?.length ? (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <p className="text-sm font-medium text-[var(--color-text-muted)] mb-2">{t('student:schoolsUniversitiesAttended', 'Schools / Universities attended')}</p>
            <ul className="space-y-2">
              {profile.schoolsAttended.map((s, i) => (
                <li key={i} className="text-sm">
                  {s.institutionName ?? '--'} {s.country && `(${s.country})`} {s.attendedFrom && s.attendedTo && ` · ${s.attendedFrom.slice(0, 4)}–${s.attendedTo.slice(0, 4)}`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card className="border-primary-accent/25 bg-[var(--color-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-accent" aria-hidden />
              {t('university:studentDocuments', 'Student documents')}
            </CardTitle>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {t('university:studentDocumentsHint', 'Approved student uploads are shown here for university review.')}
            </p>
          </div>
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
            {documents.length}
          </span>
        </div>
        {documents.length ? (
          <ul className="mt-4 grid gap-2">
            {documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{d.name ?? d.type}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {[d.certificateType, d.score ? `${t('university:scoreLabel', 'Score')}: ${d.score}` : null].filter(Boolean).join(' · ') || d.type}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setFilePreview(d)}>
                  {t('common:preview', 'Preview')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-input border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
            {t('university:noStudentDocuments', 'No approved student documents yet.')}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>{t('university:languages', 'Languages')}</CardTitle>
        <div className="mt-2 text-sm">
          {profile.languageLevel && <p><span className="text-[var(--color-text-muted)]">{t('student:languageLevel', 'Language level')}: </span>{profile.languageLevel}</p>}
          {profile.languages?.length ? (
            <ul className="list-disc list-inside mt-1">
              {profile.languages.map((l, i) => (
                <li key={i}>{l.language} -- {l.level}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--color-text-muted)]">--</p>
          )}
        </div>
      </Card>

      {profile.bio && (
        <Card>
          <CardTitle>{t('student:bio', 'About me')}</CardTitle>
          <p className="mt-2 text-sm whitespace-pre-wrap">{profile.bio}</p>
        </Card>
      )}

      <Card>
        <CardTitle>{t('student:skills', 'Skills')}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.skills?.length ? profile.skills.map((s, i) => (
            <span key={i} className="px-2 py-1 rounded-full bg-[var(--color-bg-muted)] text-sm">{s}</span>
          )) : <p className="text-sm text-[var(--color-text-muted)]">--</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>{t('university:interests', 'Interests')}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.interests?.length ? profile.interests.map((s, i) => (
            <span key={i} className="px-2 py-1 rounded-full bg-[var(--color-bg-muted)] text-sm">{s}</span>
          )) : <p className="text-sm text-[var(--color-text-muted)]">--</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>{t('university:hobbies', 'Hobbies')}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.hobbies?.length ? profile.hobbies.map((s, i) => (
            <span key={i} className="px-2 py-1 rounded-full bg-[var(--color-bg-muted)] text-sm">{s}</span>
          )) : <p className="text-sm text-[var(--color-text-muted)]">--</p>}
        </div>
      </Card>

      {profile.experiences?.length ? (
        <Card>
          <CardTitle>{t('student:stepExperience', 'Work Experience')}</CardTitle>
          <ul className="mt-2 space-y-3">
            {profile.experiences.map((e, i) => (
              <li key={i} className="text-sm border-b border-[var(--color-border)] pb-2 last:border-0">
                <p className="font-medium">{e.title ?? e.type}</p>
                {e.organization && <p className="text-[var(--color-text-muted)]">{e.organization}</p>}
                {(e.startDate || e.endDate) && (
                  <p className="text-[var(--color-text-muted)]">
                    {e.startDate ? formatDate(e.startDate) : '?'} -- {e.endDate ? formatDate(e.endDate) : t('common:present', 'Present')}
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
          <CardTitle>{t('student:stepWorks', 'Portfolio & Extracurriculars')}</CardTitle>
          <ul className="mt-2 space-y-3">
            {profile.portfolioWorks.map((w, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">{w.title ?? t('student:portfolioWork', 'Work / project')}</p>
                {w.description && <p className="text-[var(--color-text-muted)]">{w.description}</p>}
                {w.linkUrl && (
                  <a href={w.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-accent mt-1">
                    <ExternalLink size={14} /> {t('common:link', 'Link')}
                  </a>
                )}
                {w.fileUrl && (
                  <a href={w.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-accent mt-1 ml-2">
                    <FileText size={14} /> {t('common:file', 'File')}
                  </a>
                )}
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
