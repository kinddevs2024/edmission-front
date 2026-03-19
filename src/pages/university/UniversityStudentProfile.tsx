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
import { MessageCircle, FileText, ExternalLink } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getStudentDisplayName } from '@/utils/studentDisplay'

const EMPTY = '—'

export function UniversityStudentProfile() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['common', 'university', 'student', 'documents'])
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
          setError(t('university:studentProfile.limitReachedError', 'You have reached the maximum number of student profiles for your current plan. Please upgrade your subscription to view more students.'))
        } else {
          setError(t('university:studentProfile.failedToLoadProfile', 'Failed to load profile.'))
        }
      })
      .finally(() => setLoading(false))
  }, [studentId, t])

  const renderValue = (value?: string | number | null) => (value == null || value === '' ? EMPTY : value)
  const renderBool = (value?: boolean | null) => (value == null ? EMPTY : value ? t('common:yes', 'Yes') : t('common:no', 'No'))
  const degreeLabel = (value?: string | null) => {
    if (value === 'master') return t('student:degreeMaster', 'Master')
    if (value === 'phd') return t('student:degreePhd', 'PhD')
    if (value === 'bachelor') return t('student:degreeBachelor', 'Bachelor')
    return EMPTY
  }

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

  const name = getStudentDisplayName(profile, t('university:studentLabel'))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink onClick={() => navigate(-1)}>{t('common:back')}</BackLink>
        <Button to={`/university/chat?studentId=${encodeURIComponent(profile.id)}`} size="sm" icon={<MessageCircle size={16} />}>
          {t('university:navChat')}
        </Button>
      </div>

      <PageTitle title={name} icon="User" />

      <div className={cn('grid gap-6', 'md:grid-cols-[minmax(0,340px)_1fr]')}>
        <div className="space-y-4">
          {profile.readiness && (
            <Card className="border-primary-accent/20">
              <CardTitle>{t('university:studentProfile.readinessTitle', 'Readiness for university')}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span className={profile.readiness.profile ? 'text-green-600 dark:text-green-400' : 'text-[var(--color-text-muted)]'}>
                  {profile.readiness.profile ? '✓' : '○'} {t('university:studentProfile.readinessProfile', 'Profile (country, city)')}
                </span>
                <span className={profile.readiness.education ? 'text-green-600 dark:text-green-400' : 'text-[var(--color-text-muted)]'}>
                  {profile.readiness.education ? '✓' : '○'} {t('university:studentProfile.readinessEducation', 'Education (grades)')}
                </span>
                <span className={profile.readiness.certificates ? 'text-green-600 dark:text-green-400' : 'text-[var(--color-text-muted)]'}>
                  {profile.readiness.certificates ? '✓' : '○'} {t('university:studentProfile.readinessCertificates', 'Certificates')}
                </span>
                {profile.readiness.ready && <span className="font-medium text-primary-accent">{t('university:studentProfile.ready', 'Ready')}</span>}
              </div>
            </Card>
          )}

          <div className="flex justify-center md:justify-start">
            <img src={getStudentAvatarUrl(profile.avatarUrl)} alt="" loading="lazy" className="h-24 w-24 rounded-full object-cover border border-[var(--color-border)]" />
          </div>

          <Card>
            <CardTitle>{t('university:studentProfile.personal', 'Personal')}</CardTitle>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              <dt className="text-[var(--color-text-muted)]">{t('student:firstName', 'First name')}</dt><dd>{renderValue(profile.firstName)}</dd>
              <dt className="text-[var(--color-text-muted)]">{t('student:lastName', 'Last name')}</dt><dd>{renderValue(profile.lastName)}</dd>
              <dt className="text-[var(--color-text-muted)]">{t('common:email', 'Email')}</dt><dd>{renderValue(profile.email)}</dd>
              <dt className="text-[var(--color-text-muted)]">{t('student:birthDate', 'Date of birth')}</dt><dd>{profile.birthDate ? formatDate(profile.birthDate) : EMPTY}</dd>
            </dl>
          </Card>

          <Card>
            <CardTitle>{t('university:studentProfile.location', 'Location')}</CardTitle>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              <dt className="text-[var(--color-text-muted)]">{t('student:country', 'Country')}</dt><dd>{renderValue(profile.country)}</dd>
              <dt className="text-[var(--color-text-muted)]">{t('student:city', 'City')}</dt><dd>{renderValue(profile.city)}</dd>
            </dl>
          </Card>

          {profile.budgetAmount != null && Number(profile.budgetAmount) >= 0 && (
            <Card>
              <CardTitle>{t('university:budgetLabel', 'Budget for studies')}</CardTitle>
              <p className="mt-2 text-sm">{Number(profile.budgetAmount).toLocaleString()} {profile.budgetCurrency ?? 'USD'}</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>{t('university:studentProfile.education', 'Education')}</CardTitle>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              {(profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd') && (
                <>
                  <dt className="text-[var(--color-text-muted)]">{t('student:applyingForDegree', 'Applying for degree')}</dt>
                  <dd>{degreeLabel(profile.targetDegreeLevel)}</dd>
                </>
              )}
              <dt className="text-[var(--color-text-muted)]">{t('student:gradeLevel', 'Grade / education level')}</dt><dd>{renderValue(profile.gradeLevel)}</dd>
              <dt className="text-[var(--color-text-muted)]">{t('student:gpa', 'GPA')}</dt><dd>{renderValue(profile.gpa)}</dd>
              <dt className="text-[var(--color-text-muted)]">{profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd' ? t('student:institutionCompleted', 'University completed') : t('student:schoolCompleted', 'School completed')}</dt><dd>{renderBool(profile.schoolCompleted)}</dd>
              <dt className="text-[var(--color-text-muted)]">{profile.targetDegreeLevel === 'master' || profile.targetDegreeLevel === 'phd' ? t('student:institutionName', 'University / Institution name') : t('student:schoolName', 'School name')}</dt><dd>{renderValue(profile.schoolName)}</dd>
              <dt className="text-[var(--color-text-muted)]">{t('student:graduationYear', 'Graduation year')}</dt><dd>{renderValue(profile.graduationYear)}</dd>
              {profile.gradingScheme ? <><dt className="text-[var(--color-text-muted)]">{t('student:gradingScheme', 'Grading scheme')}</dt><dd>{profile.gradingScheme}</dd></> : null}
              {profile.gradeScale != null ? <><dt className="text-[var(--color-text-muted)]">{t('student:gradeScaleOutOf', 'Grade scale (out of)')}</dt><dd>{profile.gradeScale}</dd></> : null}
              {profile.highestEducationLevel ? <><dt className="text-[var(--color-text-muted)]">{t('student:highestLevelOfEducation', 'Highest level of education')}</dt><dd>{profile.highestEducationLevel}</dd></> : null}
            </dl>
            {profile.schoolsAttended?.length ? (
              <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                <p className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">{t('student:schoolsUniversitiesAttended', 'Schools / Universities attended')}</p>
                <ul className="space-y-2">
                  {profile.schoolsAttended.map((school, index) => (
                    <li key={index} className="text-sm">
                      {school.institutionName ?? EMPTY}
                      {school.country ? ` (${school.country})` : ''}
                      {school.attendedFrom && school.attendedTo ? ` · ${school.attendedFrom.slice(0, 4)}-${school.attendedTo.slice(0, 4)}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardTitle>{t('university:studentProfile.languages', 'Languages')}</CardTitle>
            <div className="mt-2 text-sm">
              {profile.languageLevel ? <p><span className="text-[var(--color-text-muted)]">{t('university:studentProfile.level', 'Level')}: </span>{profile.languageLevel}</p> : null}
              {profile.languages?.length ? (
                <ul className="mt-1 list-inside list-disc">
                  {profile.languages.map((language, index) => (
                    <li key={index}>{language.language} - {language.level}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--color-text-muted)]">{EMPTY}</p>
              )}
            </div>
          </Card>

          {profile.bio ? (
            <Card>
              <CardTitle>{t('university:studentProfile.about', 'About')}</CardTitle>
              <p className="mt-2 whitespace-pre-wrap text-sm">{profile.bio}</p>
            </Card>
          ) : null}

          <Card>
            <CardTitle>{t('university:studentProfile.skills', 'Skills')}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.skills?.length
                ? profile.skills.map((skill, index) => <span key={index} className="rounded-full bg-[var(--color-bg-muted)] px-2 py-1 text-sm">{skill}</span>)
                : <p className="text-sm text-[var(--color-text-muted)]">{EMPTY}</p>}
            </div>
          </Card>

          <Card>
            <CardTitle>{t('university:studentProfile.interests', 'Interests')}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.interests?.length
                ? profile.interests.map((interest, index) => <span key={index} className="rounded-full bg-[var(--color-bg-muted)] px-2 py-1 text-sm">{interest}</span>)
                : <p className="text-sm text-[var(--color-text-muted)]">{EMPTY}</p>}
            </div>
          </Card>

          <Card>
            <CardTitle>{t('university:studentProfile.hobbies', 'Hobbies')}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.hobbies?.length
                ? profile.hobbies.map((hobby, index) => <span key={index} className="rounded-full bg-[var(--color-bg-muted)] px-2 py-1 text-sm">{hobby}</span>)
                : <p className="text-sm text-[var(--color-text-muted)]">{EMPTY}</p>}
            </div>
          </Card>

          {profile.experiences?.length ? (
            <Card>
              <CardTitle>{t('university:studentProfile.experience', 'Experience')}</CardTitle>
              <ul className="mt-2 space-y-3">
                {profile.experiences.map((experience, index) => (
                  <li key={index} className="border-b border-[var(--color-border)] pb-2 text-sm last:border-0">
                    <p className="font-medium">{experience.title ?? experience.type}</p>
                    {experience.organization ? <p className="text-[var(--color-text-muted)]">{experience.organization}</p> : null}
                    {(experience.startDate || experience.endDate) ? (
                      <p className="text-[var(--color-text-muted)]">
                        {experience.startDate ? formatDate(experience.startDate) : '?'} - {experience.endDate ? formatDate(experience.endDate) : t('common:present', 'Present')}
                      </p>
                    ) : null}
                    {experience.description ? <p className="mt-1">{experience.description}</p> : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {profile.portfolioWorks?.length ? (
            <Card>
              <CardTitle>{t('university:studentProfile.portfolioWorks', 'Portfolio / works')}</CardTitle>
              <ul className="mt-2 space-y-3">
                {profile.portfolioWorks.map((work, index) => (
                  <li key={index} className="text-sm">
                    <p className="font-medium">{work.title ?? t('student:portfolioWork', 'Work / project')}</p>
                    {work.description ? <p className="text-[var(--color-text-muted)]">{work.description}</p> : null}
                    {work.linkUrl ? (
                      <a href={work.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary-accent">
                        <ExternalLink size={14} /> {t('common:open', 'Open')}
                      </a>
                    ) : null}
                    {work.fileUrl ? (
                      <a href={work.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-2 mt-1 inline-flex items-center gap-1 text-primary-accent">
                        <FileText size={14} /> {t('common:file', 'File')}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {profile.documents?.length ? (
            <Card>
              <CardTitle>{t('university:studentProfile.approvedDocuments', 'Documents (approved)')}</CardTitle>
              <ul className="mt-2 space-y-2">
                {profile.documents.map((document) => (
                  <li key={document.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    <span className="font-medium">{document.name ?? document.type}</span>
                    {document.certificateType ? <span className="text-[var(--color-text-muted)]">{document.certificateType}</span> : null}
                    {document.score ? <span className="text-[var(--color-text-muted)]">{t('university:studentProfile.score', 'Score')}: {document.score}</span> : null}
                    <button type="button" onClick={() => setFilePreview(document)} className="text-primary-accent hover:underline">
                      {t('common:preview', 'Preview')}
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
        title={filePreview?.name ?? filePreview?.type ?? t('documents:common.document', 'Document')}
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
