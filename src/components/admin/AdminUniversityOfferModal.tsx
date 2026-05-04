import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SendDocumentModal } from '@/components/documents/SendDocumentModal'
import {
  adminUniversityCreateOffer,
  adminUniversityGetScholarshipsForAccount,
  adminUniversityListOfferTemplates,
  getStudentProfileByUser,
  getUsers,
} from '@/services/admin'
import { notifySuccess } from '@/utils/notify'
import { toastApiError } from '@/utils/toastError'

type Tab = 'document' | 'scholarship'

type Props = {
  open: boolean
  onClose: () => void
  universityUserId: string
  /** Student profile Mongo id */
  initialStudentProfileId?: string
  initialStudentLabel?: string
  initialChatId?: string
}

export function AdminUniversityOfferModal({
  open,
  onClose,
  universityUserId,
  initialStudentProfileId,
  initialStudentLabel,
  initialChatId,
}: Props) {
  const { t } = useTranslation(['admin', 'common', 'documents'])
  const [tab, setTab] = useState<Tab>('document')
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [candidates, setCandidates] = useState<Array<{ id: string; email: string; name?: string }>>([])
  const [studentProfileId, setStudentProfileId] = useState<string | undefined>(initialStudentProfileId)
  const [studentLabel, setStudentLabel] = useState(initialStudentLabel ?? '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [scholarships, setScholarships] = useState<Array<{ id: string; name?: string; coveragePercent?: number }>>([])
  const [offerTemplates, setOfferTemplates] = useState<Array<{ id: string; name?: string }>>([])
  const [scholarshipId, setScholarshipId] = useState('')
  const [certificateTemplateId, setCertificateTemplateId] = useState('')
  const [coveragePercent, setCoveragePercent] = useState('50')
  const [deadline, setDeadline] = useState('')
  const [sendingOffer, setSendingOffer] = useState(false)

  useEffect(() => {
    if (!open) return
    setTab('document')
    setSearch('')
    setCandidates([])
    setStudentProfileId(initialStudentProfileId)
    setStudentLabel(initialStudentLabel ?? '')
    setScholarshipId('')
    setCertificateTemplateId('')
    setCoveragePercent('50')
    setDeadline('')
    setDocumentModalOpen(false)
  }, [open, initialStudentProfileId, initialStudentLabel])

  useEffect(() => {
    if (!open || !universityUserId) return
    adminUniversityGetScholarshipsForAccount(universityUserId)
      .then((list) =>
        setScholarships(
          (list ?? []).map((s) => ({
            id: String(s.id ?? s._id ?? ''),
            name: (s.name as string | undefined) ?? undefined,
            coveragePercent: s.coveragePercent != null ? Number(s.coveragePercent) : undefined,
          }))
        )
      )
      .catch(() => setScholarships([]))
    adminUniversityListOfferTemplates(universityUserId)
      .then((list) =>
        setOfferTemplates(
          (list ?? []).map((row) => ({
            id: String(row.id ?? row._id ?? ''),
            name: (row.name as string | undefined) ?? undefined,
          }))
        )
      )
      .catch(() => setOfferTemplates([]))
  }, [open, universityUserId])

  useEffect(() => {
    if (!open) return
    const q = search.trim()
    if (q.length < 2) {
      setCandidates([])
      return
    }
    const handle = window.setTimeout(() => {
      setSearching(true)
      getUsers({ role: 'student', search: q, limit: 15, page: 1 })
        .then((res) => setCandidates(res.data ?? []))
        .catch((e) => {
          toastApiError(e)
          setCandidates([])
        })
        .finally(() => setSearching(false))
    }, 300)
    return () => window.clearTimeout(handle)
  }, [search, open])

  const pickStudent = (userId: string) => {
    setProfileLoading(true)
    getStudentProfileByUser(userId)
      .then((profile) => {
        const pid = String(profile.id ?? profile._id ?? '')
        const first = String(profile.firstName ?? '').trim()
        const last = String(profile.lastName ?? '').trim()
        const full = [first, last].filter(Boolean).join(' ').trim()
        const email = (profile.user as { email?: string } | undefined)?.email
        setStudentProfileId(pid)
        setStudentLabel(full || email || userId)
      })
      .catch(toastApiError)
      .finally(() => setProfileLoading(false))
  }

  const canSendDocument = Boolean(studentProfileId)
  const canSendScholarshipOffer = Boolean(studentProfileId) && coveragePercent.trim() !== ''

  const handleSendScholarshipOffer = () => {
    if (!studentProfileId) return
    const cov = Number(coveragePercent)
    if (!Number.isFinite(cov) || cov < 0 || cov > 100) {
      toastApiError(new Error('Coverage must be 0–100'))
      return
    }
    setSendingOffer(true)
    adminUniversityCreateOffer(universityUserId, {
      studentId: studentProfileId,
      scholarshipId: scholarshipId || undefined,
      coveragePercent: cov,
      deadline: deadline || undefined,
      certificateTemplateId: certificateTemplateId || undefined,
    })
      .then(() => {
        notifySuccess(t('admin:offerSent', 'Offer sent'))
        onClose()
      })
      .catch(toastApiError)
      .finally(() => setSendingOffer(false))
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t('admin:sendOfferAsUniversity', 'Send offer as this university')}
        footer={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>
              {t('common:close', 'Close')}
            </Button>
            {tab === 'document' && canSendDocument ? (
              <Button onClick={() => setDocumentModalOpen(true)}>{t('admin:openDocumentOffer', 'Document offer…')}</Button>
            ) : null}
            {tab === 'scholarship' && canSendScholarshipOffer ? (
              <Button onClick={handleSendScholarshipOffer} loading={sendingOffer}>
                {t('admin:sendScholarshipOffer', 'Send scholarship offer')}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant={tab === 'document' ? 'primary' : 'secondary'} onClick={() => setTab('document')}>
              {t('documents:type.offer', 'Offer')} / {t('documents:type.scholarship', 'Scholarship')} ({t('admin:tabDocument', 'Document')})
            </Button>
            <Button size="sm" variant={tab === 'scholarship' ? 'primary' : 'secondary'} onClick={() => setTab('scholarship')}>
              {t('admin:tabScholarshipOffer', 'Scholarship offer (simple)')}
            </Button>
          </div>

          <div className="rounded-input border border-[var(--color-border)] p-3 space-y-2">
            <p className="text-sm font-medium">{t('admin:selectStudent', 'Student')}</p>
            {studentProfileId ? (
              <p className="text-sm">
                <span className="text-[var(--color-text-muted)]">{t('admin:selected', 'Selected')}:</span>{' '}
                <span className="font-medium">{studentLabel || studentProfileId}</span>
                <Button className="ml-2" size="sm" variant="secondary" onClick={() => { setStudentProfileId(undefined); setStudentLabel('') }}>
                  {t('common:change', 'Change')}
                </Button>
              </p>
            ) : (
              <>
                <Input
                  label={t('admin:searchStudents', 'Search students (email or name)')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('admin:minTwoCharacters', 'min 2 characters')}
                />
                {searching ? <p className="text-xs text-[var(--color-text-muted)]">{t('common:loading', 'Loading…')}</p> : null}
                <ul className="max-h-40 overflow-y-auto space-y-1">
                  {candidates.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="w-full text-left text-sm rounded-input px-2 py-1.5 hover:bg-[var(--color-border)]"
                        onClick={() => pickStudent(u.id)}
                      >
                        {u.name || u.email} <span className="text-[var(--color-text-muted)]">({u.email})</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {profileLoading ? <p className="text-xs text-[var(--color-text-muted)]">{t('admin:loadingProfile', 'Loading profile…')}</p> : null}
              </>
            )}
          </div>

          {tab === 'scholarship' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t('admin:coveragePercent', 'Coverage %')}
                type="number"
                min={0}
                max={100}
                value={coveragePercent}
                onChange={(e) => setCoveragePercent(e.target.value)}
              />
              <Input label={t('admin:deadline', 'Deadline (optional)')} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              <Select
                label={t('admin:linkedScholarship', 'Scholarship (optional)')}
                value={scholarshipId}
                onChange={(e) => setScholarshipId(e.target.value)}
                options={[{ value: '', label: '—' }, ...scholarships.map((s) => ({ value: s.id, label: s.name ? `${s.name} (${s.coveragePercent ?? '?'}%)` : s.id }))]}
                className="sm:col-span-2"
              />
              <Select
                label={t('admin:offerCertificateTemplate', 'Offer certificate template (optional)')}
                value={certificateTemplateId}
                onChange={(e) => setCertificateTemplateId(e.target.value)}
                options={[{ value: '', label: '—' }, ...offerTemplates.map((o) => ({ value: o.id, label: o.name ?? o.id }))]}
                className="sm:col-span-2"
              />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('admin:documentOfferHint', 'Use “Document offer” to pick a template and send the same PDF flow as the university.')}
            </p>
          )}
        </div>
      </Modal>

      {studentProfileId ? (
        <SendDocumentModal
          open={documentModalOpen}
          onClose={() => setDocumentModalOpen(false)}
          studentId={studentProfileId}
          chatId={initialChatId}
          studentName={studentLabel}
          actingUniversityUserId={universityUserId}
          onSent={() => {
            setDocumentModalOpen(false)
            notifySuccess(t('admin:documentSent', 'Document sent'))
            onClose()
          }}
        />
      ) : null}
    </>
  )
}
