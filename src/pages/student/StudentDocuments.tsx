import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/services/auth'
import { getMyDocuments, addDocument, type StudentDocumentItem, type DocumentType, type AddDocumentPayload } from '@/services/studentDocuments'
import { getApiError } from '@/services/auth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { FileUpload } from '@/components/ui/FileUpload'
import { ShieldCheck, FileText, Loader2 } from 'lucide-react'

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'transcript', label: 'Transcript' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'language_certificate', label: 'Language certificate' },
  { value: 'course_certificate', label: 'Course certificate' },
  { value: 'other', label: 'Other' },
]

const LANGUAGE_CERT_TYPES: { value: string; label: string; scores?: { min: number; max: number } }[] = [
  { value: 'IELTS', label: 'IELTS', scores: { min: 0, max: 9 } },
  { value: 'TOEFL', label: 'TOEFL', scores: { min: 0, max: 120 } },
  { value: 'Cambridge', label: 'Cambridge' },
  { value: 'Duolingo', label: 'Duolingo', scores: { min: 0, max: 160 } },
  { value: 'other', label: 'Other' },
]

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

function getScoreStep(certType: string): number {
  const t = LANGUAGE_CERT_TYPES.find((c) => c.value === certType)
  if (!t?.scores) return 1
  const range = t.scores.max - t.scores.min
  if (range <= 10) return 0.5
  if (range <= 30) return 1
  return 5
}

export function StudentDocuments() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<StudentDocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState<DocumentType>('transcript')
  const [name, setName] = useState('')
  const [certificateType, setCertificateType] = useState('IELTS')
  const [score, setScore] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    getMyDocuments()
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const isLanguageCert = type === 'language_certificate'
  const certMeta = LANGUAGE_CERT_TYPES.find((c) => c.value === certificateType)
  const scoreMin = certMeta?.scores?.min ?? 0
  const scoreMax = certMeta?.scores?.max ?? 9
  const scoreStep = getScoreStep(certificateType)

  const handleAdd = async () => {
    if (!fileUrl.trim()) {
      setError('Please upload a file first.')
      return
    }
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter a document name (e.g. IELTS, School certificate).')
      return
    }
    if (isLanguageCert && !score.trim()) {
      setError('Please enter the score/level for the language certificate.')
      return
    }
    setError('')
    setAdding(true)
    try {
      const payload: AddDocumentPayload = {
        type,
        fileUrl,
        name: trimmedName,
      }
      if (isLanguageCert) {
        payload.certificateType = certificateType
        payload.score = score.trim()
      }
      await addDocument(payload)
      setName('')
      setCertificateType('IELTS')
      setScore('')
      setFileUrl('')
      load()
      getProfile().catch(() => {})
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setAdding(false)
    }
  }

  const verified = user?.studentProfile?.verifiedAt

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <PageTitle title="Documents" icon="FileText" />
        {verified && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-600 dark:text-green-400" title="Verified student">
            <ShieldCheck className="w-4 h-4" aria-hidden />
            Verified
          </span>
        )}
      </div>

      <Card>
        <CardTitle>Upload document</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Add a name (e.g. IELTS, school certificate). For language certificates, choose type and score/level, then upload the file.
        </p>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Document type</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as DocumentType)
                  if (e.target.value !== 'language_certificate') setScore('')
                }}
                className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                aria-label="Document type"
              >
                {DOC_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isLanguageCert ? 'e.g. IELTS' : 'e.g. High school diploma'}
                className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                aria-label="Document name"
              />
            </div>
          </div>

          {isLanguageCert && (
            <div className="grid gap-4 sm:grid-cols-2 p-3 rounded-lg bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
              <div>
                <label className="block text-sm font-medium mb-1">Certificate type</label>
                <select
                  value={certificateType}
                  onChange={(e) => {
                    setCertificateType(e.target.value)
                    setScore('')
                  }}
                  className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                  aria-label="Language certificate type"
                >
                  {LANGUAGE_CERT_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Score / level</label>
                {certMeta?.scores ? (
                  <input
                    type="number"
                    min={scoreMin}
                    max={scoreMax}
                    step={scoreStep}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder={`${scoreMin}–${scoreMax}`}
                    className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                    aria-label="Score"
                  />
                ) : (
                  <input
                    type="text"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. B2, C1"
                    className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                    aria-label="Level"
                  />
                )}
              </div>
            </div>
          )}

          <div>
            <FileUpload value={fileUrl} onChange={setFileUrl} accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" label="File (image or PDF)" />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <Button className="mt-3" size="sm" onClick={handleAdd} disabled={adding || !fileUrl.trim() || !name.trim() || (isLanguageCert && !score.trim())} loading={adding}>
          Submit for review
        </Button>
      </Card>

      <Card>
        <CardTitle>My documents</CardTitle>
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-[var(--color-text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : docs.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-6">No documents yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border)]">
            {docs.map((d) => (
              <li key={d.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" aria-hidden />
                  <span className="font-medium">{d.name || d.type.replace(/_/g, ' ')}</span>
                  {d.type === 'language_certificate' && (d.certificateType || d.score) && (
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {[d.certificateType, d.score].filter(Boolean).join(' — ')}
                    </span>
                  )}
                  <span className={`text-sm px-2 py-0.5 rounded ${d.status === 'approved' ? 'bg-green-500/20 text-green-600' : d.status === 'rejected' ? 'bg-red-500/20 text-red-600' : 'bg-gray-500/20 text-gray-600'}`}>
                    {STATUS_LABEL[d.status] ?? d.status}
                  </span>
                </div>
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-accent hover:underline">View file</a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
