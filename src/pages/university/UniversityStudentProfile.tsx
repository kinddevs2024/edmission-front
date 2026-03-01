import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { getStudentProfile, type FullStudentProfile } from '@/services/university'
import { getImageUrl } from '@/services/upload'
import { formatDate } from '@/utils/format'
import { ArrowLeft, MessageCircle, FileText, ExternalLink } from 'lucide-react'

export function UniversityStudentProfile() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['common', 'university'])
  const [profile, setProfile] = useState<FullStudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    setError('')
    getStudentProfile(studentId)
      .then(setProfile)
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [studentId])

  if (!studentId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>Back</Button>
        <p className="text-[var(--color-text-muted)]">Invalid student.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>Back</Button>
        <p className="text-[var(--color-text-muted)]">Loading profile…</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>Back</Button>
        <p className="text-red-500">{error || 'Student not found.'}</p>
      </div>
    )
  }

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || t('university:studentLabel')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <Button to={`/university/chat?studentId=${encodeURIComponent(profile.id)}`} size="sm" icon={<MessageCircle size={16} />}>
          {t('university:navChat')}
        </Button>
      </div>

      <PageTitle title={name} icon="User" />
      {profile.avatarUrl && (
        <div className="flex justify-center sm:justify-start">
          <img src={getImageUrl(profile.avatarUrl)} alt="" className="w-24 h-24 rounded-full object-cover border border-[var(--color-border)]" />
        </div>
      )}

      <Card>
        <CardTitle>Personal</CardTitle>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
          <dt className="text-[var(--color-text-muted)]">First name</dt><dd>{profile.firstName ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">Last name</dt><dd>{profile.lastName ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">Date of birth</dt><dd>{profile.birthDate ? formatDate(profile.birthDate) : '—'}</dd>
        </dl>
      </Card>

      <Card>
        <CardTitle>Location</CardTitle>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
          <dt className="text-[var(--color-text-muted)]">Country</dt><dd>{profile.country ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">City</dt><dd>{profile.city ?? '—'}</dd>
        </dl>
      </Card>

      <Card>
        <CardTitle>Education</CardTitle>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
          <dt className="text-[var(--color-text-muted)]">Grade / level</dt><dd>{profile.gradeLevel ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">GPA</dt><dd>{profile.gpa != null ? profile.gpa : '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">School completed</dt><dd>{profile.schoolCompleted != null ? (profile.schoolCompleted ? 'Yes' : 'No') : '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">School name</dt><dd>{profile.schoolName ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">Graduation year</dt><dd>{profile.graduationYear ?? '—'}</dd>
        </dl>
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
                <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="font-medium">{d.name ?? d.type}</span>
                {d.certificateType && <span className="text-[var(--color-text-muted)]">{d.certificateType}</span>}
                {d.score && <span className="text-[var(--color-text-muted)]">Score: {d.score}</span>}
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline">
                  View file
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button to={`/university/chat?studentId=${encodeURIComponent(profile.id)}`} icon={<MessageCircle size={16} />}>
          {t('university:navChat')}
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back to list</Button>
      </div>
    </div>
  )
}
