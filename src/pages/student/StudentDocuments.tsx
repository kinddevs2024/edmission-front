import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/services/auth'
import {
  addDocument,
  deleteDocument,
  getMyDocuments,
  updateDocument,
  type DocumentType,
  type SaveStudentDocumentPayload,
  type StudentDocumentItem,
} from '@/services/studentDocuments'
import {
  addStudentDocument as addCounsellorStudentDocument,
  deleteStudentDocument as deleteCounsellorStudentDocument,
  getStudentDocuments as getCounsellorStudentDocuments,
  updateStudentDocument as updateCounsellorStudentDocument,
} from '@/services/counsellor'
import { getApiError } from '@/services/auth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { FileUpload } from '@/components/ui/FileUpload'
import { Select } from '@/components/ui/Select'
import { DocumentEditor } from '@/components/documents/DocumentEditor'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import { toastApiError } from '@/utils/toastError'
import { useDocumentEditorStore } from '@/store/documentEditorStore'
import { ShieldCheck, FileText, Loader2, Pencil, Sparkles, Trash2, Upload } from 'lucide-react'
import type { EditableSceneDocument, StudentProfileDocumentType } from '@/types/documentModule'

const DOC_TYPES: { value: DocumentType; defaultLabel: string }[] = [
  { value: 'passport', defaultLabel: 'Passport' },
  { value: 'id_card', defaultLabel: 'ID card' },
  { value: 'transcript', defaultLabel: 'Transcript' },
  { value: 'diploma', defaultLabel: 'Diploma' },
  { value: 'language_certificate', defaultLabel: 'Language certificate' },
  { value: 'course_certificate', defaultLabel: 'Course certificate' },
  { value: 'other', defaultLabel: 'Other' },
]

const LANGUAGE_CERT_TYPES: { value: string; label: string; scores?: { min: number; max: number } }[] = [
  { value: 'IELTS', label: 'IELTS', scores: { min: 0, max: 9 } },
  { value: 'TOEFL', label: 'TOEFL', scores: { min: 0, max: 120 } },
  { value: 'Cambridge', label: 'Cambridge' },
  { value: 'CEFR', label: 'CEFR' },
  { value: 'Duolingo', label: 'Duolingo', scores: { min: 0, max: 160 } },
  { value: 'other', label: 'Other' },
]

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

const SOURCE_LABEL: Record<'upload' | 'editor', string> = {
  upload: 'Uploaded file',
  editor: 'Built in editor',
}

const DOC_TYPE_SET: ReadonlySet<StudentProfileDocumentType> = new Set([
  'passport',
  'id_card',
  'transcript',
  'diploma',
  'language_certificate',
  'course_certificate',
  'other',
])

function normalizeCounsellorDocs(input: Awaited<ReturnType<typeof getCounsellorStudentDocuments>>): StudentDocumentItem[] {
  return input
    .filter((doc): doc is typeof doc & { type: StudentProfileDocumentType } => DOC_TYPE_SET.has(doc.type as StudentProfileDocumentType))
    .map((doc) => ({
      ...doc,
      type: doc.type as StudentProfileDocumentType,
      source: doc.source === 'editor' ? 'editor' : 'upload',
      status: doc.status ?? 'pending',
    }))
}

function getScoreStep(certType: string): number {
  const certificate = LANGUAGE_CERT_TYPES.find((item) => item.value === certType)
  if (!certificate?.scores) return 1
  const range = certificate.scores.max - certificate.scores.min
  if (range <= 10) return 0.5
  if (range <= 30) return 1
  return 5
}

type StudentDocumentsProps = {
  counsellorMode?: boolean
  studentUserId?: string
}

export function StudentDocuments({ counsellorMode = false, studentUserId }: StudentDocumentsProps) {
  const { t } = useTranslation(['common', 'documents'])
  const { user } = useAuth()
  const resetEditor = useDocumentEditorStore((state) => state.reset)
  const loadSceneDocument = useDocumentEditorStore((state) => state.loadSceneDocument)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [docs, setDocs] = useState<StudentDocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [builderSaving, setBuilderSaving] = useState(false)
  const [composerMode, setComposerMode] = useState<'upload' | 'editor'>('upload')
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<StudentDocumentItem | null>(null)
  const [type, setType] = useState<DocumentType>('transcript')
  const [name, setName] = useState('')
  const [certificateType, setCertificateType] = useState('IELTS')
  const [score, setScore] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    const request = counsellorMode && studentUserId
      ? getCounsellorStudentDocuments(studentUserId)
      : getMyDocuments()
    request
      .then((items) => setDocs(counsellorMode ? normalizeCounsellorDocs(items) : (items as StudentDocumentItem[])))
      .catch((loadError) => {
        toastApiError(loadError)
        setDocs([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const isLanguageCert = type === 'language_certificate'
  const certMeta = LANGUAGE_CERT_TYPES.find((item) => item.value === certificateType)
  const scoreMin = certMeta?.scores?.min ?? 0
  const scoreMax = certMeta?.scores?.max ?? 9
  const scoreStep = getScoreStep(certificateType)
  const documentTypeOptions = DOC_TYPES.map((option) => ({
    value: option.value,
    label: t(`documents:documentTypes.${option.value}`, option.defaultLabel),
  }))
  const languageCertificateTypeOptions = LANGUAGE_CERT_TYPES.map((item) => ({
    value: item.value,
    label: item.value === 'other' ? t('documents:documentTypes.other', 'Other') : item.label,
  }))
  const getDocumentTypeLabel = (documentType: string) =>
    t(`documents:documentTypes.${documentType}`, documentType.replace(/_/g, ' '))
  const getStatusLabel = (status: string) =>
    t(`documents:studentDocumentStatus.${status}`, STATUS_LABEL[status] ?? status)
  const getSourceLabel = (source: 'upload' | 'editor') =>
    t(`documents:studentDocumentSource.${source}`, SOURCE_LABEL[source])

  const handleAddUpload = async () => {
    if (!fileUrl.trim()) {
      setError(t('documents:studentDocuments.uploadFileFirst', 'Please upload a file first.'))
      return
    }
    const trimmedName = name.trim()
    const resolvedName = trimmedName || (isLanguageCert ? certificateType.trim() : '')
    if (!resolvedName) {
      setError(t('documents:studentDocuments.enterDocumentName', 'Please enter a document name.'))
      return
    }
    if (isLanguageCert && !score.trim()) {
      setError(t('documents:studentDocuments.enterLanguageScore', 'Please enter the score or level for the language certificate.'))
      return
    }

    setError('')
    setAdding(true)
    try {
      const payload: SaveStudentDocumentPayload = {
        source: 'upload',
        type,
        fileUrl,
        name: resolvedName,
      }
      if (isLanguageCert) {
        payload.certificateType = certificateType
        payload.score = score.trim()
      }
      if (counsellorMode && studentUserId) {
        await addCounsellorStudentDocument(studentUserId, payload)
      } else {
        await addDocument(payload)
      }
      setName('')
      setCertificateType('IELTS')
      setScore('')
      setFileUrl('')
      load()
      if (!counsellorMode) getProfile().catch(toastApiError)
    } catch (uploadError) {
      setError(getApiError(uploadError).message)
    } finally {
      setAdding(false)
    }
  }

  const startNewBuilder = () => {
    setComposerMode('editor')
    setEditingDocumentId(null)
    setError('')
    resetEditor({
      type: 'transcript',
      pageFormat: 'A4_PORTRAIT',
    })
  }

  const openBuilderDocument = (document: StudentDocumentItem) => {
    if (!document.canvasJson) return
    setComposerMode('editor')
    setEditingDocumentId(document.id)
    setError('')
    loadSceneDocument({
      id: document.id,
      name: document.name ?? getDocumentTypeLabel(document.type),
      type: document.type as StudentProfileDocumentType,
      pageFormat: document.pageFormat ?? 'A4_PORTRAIT',
      width: document.width,
      height: document.height,
      editorVersion: document.editorVersion ?? '1.0.0',
      canvasJson: document.canvasJson,
    })
  }

  const handleSaveBuilder = async (payload: EditableSceneDocument & { type: StudentProfileDocumentType; name: string }) => {
    setError('')
    setBuilderSaving(true)
    try {
      const savePayload: SaveStudentDocumentPayload = {
        source: 'editor',
        type: payload.type,
        name: payload.name,
        canvasJson: payload.canvasJson,
        pageFormat: payload.pageFormat,
        width: payload.width,
        height: payload.height,
        editorVersion: payload.editorVersion,
        previewImageUrl: payload.previewImageUrl,
      }
      const saved = editingDocumentId
        ? counsellorMode && studentUserId
          ? await updateCounsellorStudentDocument(studentUserId, editingDocumentId, savePayload)
          : await updateDocument(editingDocumentId, savePayload)
        : counsellorMode && studentUserId
          ? await addCounsellorStudentDocument(studentUserId, savePayload)
          : await addDocument(savePayload)

      setEditingDocumentId(saved.id)
      load()
      if (!counsellorMode) getProfile().catch(toastApiError)
      if (saved.canvasJson) {
        loadSceneDocument({
          id: saved.id,
          name: saved.name ?? getDocumentTypeLabel(saved.type),
          type: saved.type as StudentProfileDocumentType,
          pageFormat: saved.pageFormat ?? 'A4_PORTRAIT',
          width: saved.width,
          height: saved.height,
          editorVersion: saved.editorVersion ?? '1.0.0',
          canvasJson: saved.canvasJson,
        })
      }
    } catch (saveError) {
      setError(getApiError(saveError).message)
    } finally {
      setBuilderSaving(false)
    }
  }

  const handleDeleteDocument = async (document: StudentDocumentItem) => {
    const documentLabel = document.name ?? getDocumentTypeLabel(document.type)
    if (!window.confirm(t('documents:studentDocuments.deleteConfirm', { name: documentLabel, defaultValue: 'Delete "{{name}}"?' }))) return
    try {
      if (counsellorMode && studentUserId) {
        await deleteCounsellorStudentDocument(studentUserId, document.id)
      } else {
        await deleteDocument(document.id)
      }
      if (editingDocumentId === document.id) {
        setEditingDocumentId(null)
        setComposerMode('upload')
      }
      if (previewDocument?.id === document.id) {
        setPreviewDocument(null)
      }
      load()
      if (!counsellorMode) getProfile().catch(toastApiError)
    } catch (deleteError) {
      setError(getApiError(deleteError).message)
    }
  }

  const verified = user?.studentProfile?.verifiedAt

  const openUploadMode = () => {
    setComposerMode('upload')
    setTimeout(() => uploadInputRef.current?.click(), 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <PageTitle title={t('common:documents')} icon="FileText" />
        {verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-sm font-medium text-green-600 dark:text-green-400" title={t('common:verifiedStudent')}>
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {t('common:verified')}
          </span>
        ) : null}
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>
              {composerMode === 'upload'
                ? t('documents:studentDocuments.uploadDocument', 'Upload document')
                : editingDocumentId
                  ? t('documents:studentDocuments.editProfileDocument', 'Edit profile document')
                  : t('documents:studentDocuments.createProfileDocument', 'Create profile document')}
            </CardTitle>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {composerMode === 'upload'
                ? t('documents:studentDocuments.uploadHint', 'Upload PDFs or images for review. Use the builder if you want to design a document directly in the platform.')
                : t('documents:studentDocuments.editorHint', 'This uses the same visual editor as university documents, but simplified for student profile files.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={composerMode === 'upload' ? 'primary' : 'secondary'} size="sm" onClick={openUploadMode} icon={<Upload className="h-4 w-4" />}>
              {t('documents:studentDocuments.uploadFile', 'Upload file')}
            </Button>
            <Button variant={composerMode === 'editor' ? 'primary' : 'secondary'} size="sm" onClick={startNewBuilder} icon={<Sparkles className="h-4 w-4" />}>
              {t('documents:studentDocuments.useEditor', 'Use editor')}
            </Button>
          </div>
        </div>

        {composerMode === 'upload' ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Select
                  label={t('documents:studentDocuments.documentType', 'Document type')}
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value as DocumentType)
                    if (event.target.value !== 'language_certificate') setScore('')
                  }}
                  options={documentTypeOptions}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {isLanguageCert ? t('documents:studentDocuments.name', 'Name') : <>{t('documents:studentDocuments.name', 'Name')} <span className="text-red-500">*</span></>}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={isLanguageCert ? t('documents:studentDocuments.languageNamePlaceholder', 'Optional, auto-filled from certificate type') : t('documents:studentDocuments.namePlaceholder', 'e.g. High school diploma')}
                  className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
                  aria-label={t('documents:studentDocuments.documentNameAria', 'Document name')}
                />
              </div>
            </div>

            {isLanguageCert ? (
              <div className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3 sm:grid-cols-2">
                <div>
                  <Select
                    label={t('documents:studentDocuments.certificateType', 'Certificate type')}
                    value={certificateType}
                    onChange={(event) => {
                      setCertificateType(event.target.value)
                      setScore('')
                    }}
                    options={languageCertificateTypeOptions}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('documents:studentDocuments.scoreLevel', 'Score / level')}</label>
                  {certMeta?.scores ? (
                    <input
                      type="number"
                      min={scoreMin}
                      max={scoreMax}
                      step={scoreStep}
                      value={score}
                      onChange={(event) => setScore(event.target.value)}
                      placeholder={`${scoreMin}-${scoreMax}`}
                      className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
                      aria-label={t('documents:studentDocuments.scoreAria', 'Score')}
                    />
                  ) : (
                    <input
                      type="text"
                      value={score}
                      onChange={(event) => setScore(event.target.value)}
                      placeholder={certificateType === 'CEFR' ? t('documents:studentDocuments.levelPlaceholder', 'e.g. B1, B2, C1') : t('documents:studentDocuments.levelFallbackPlaceholder', 'e.g. B2, C1')}
                      className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
                      aria-label={t('documents:studentDocuments.levelAria', 'Level')}
                    />
                  )}
                </div>
              </div>
            ) : null}

            <FileUpload
              value={fileUrl}
              onChange={setFileUrl}
              inputRef={uploadInputRef}
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/jfif,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs,application/pdf,.pdf"
              label={t('documents:studentDocuments.fileImagePdf', 'File (image or PDF)')}
            />

            <Button className="mt-1" size="sm" onClick={handleAddUpload} disabled={adding || !fileUrl.trim() || (!name.trim() && !isLanguageCert) || (isLanguageCert && !score.trim())} loading={adding}>
              {t('documents:studentDocuments.submitForReview', 'Submit for review')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[20px] border border-dashed border-[var(--color-border)] px-4 py-3">
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('documents:studentDocuments.builderHint', 'The builder is best for cover pages, personal statements, certificates, and custom profile documents.')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={startNewBuilder}>{t('documents:studentDocuments.newBlankDocument', 'New blank document')}</Button>
                {editingDocumentId ? (
                  <Button variant="ghost" size="sm" onClick={() => { setEditingDocumentId(null); setComposerMode('upload') }}>
                    {t('documents:studentDocuments.backToUpload', 'Back to upload')}
                  </Button>
                ) : null}
              </div>
            </div>

            <DocumentEditor
              mode="profile"
              saving={builderSaving}
              saveLabel={editingDocumentId ? t('documents:studentDocuments.updateDocument', 'Update document') : t('documents:studentDocuments.saveDocument', 'Save document')}
              typeOptions={documentTypeOptions}
              onSave={(payload) => handleSaveBuilder(payload as EditableSceneDocument & { type: StudentProfileDocumentType; name: string })}
            />
          </div>
        )}

        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </Card>

      <Card>
        <CardTitle>{t('documents:studentDocuments.myDocuments', 'My documents')}</CardTitle>
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-[var(--color-text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            {t('common:loading', 'Loading...')}
          </div>
        ) : docs.length === 0 ? (
          <p className="py-6 text-[var(--color-text-muted)]">{t('documents:studentDocuments.noDocumentsYet', 'No documents yet.')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border)]">
            {docs.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
                    <span className="font-medium">{document.name || getDocumentTypeLabel(document.type)}</span>
                    <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                      {getSourceLabel(document.source)}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-sm ${document.status === 'approved' ? 'bg-green-500/20 text-green-600' : document.status === 'rejected' ? 'bg-red-500/20 text-red-600' : 'bg-gray-500/20 text-gray-600'}`}>
                      {getStatusLabel(document.status)}
                    </span>
                  </div>
                  {document.type === 'language_certificate' && (document.certificateType || document.score) ? (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {[document.certificateType, document.score].filter(Boolean).join(' - ')}
                    </p>
                  ) : null}
                  {document.rejectionReason ? (
                    <p className="text-sm text-red-500">{t('documents:studentDocuments.reason', 'Reason')}: {document.rejectionReason}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPreviewDocument(document)}>
                    {t('documents:studentDocuments.preview', 'Preview')}
                  </Button>
                  {document.source === 'editor' ? (
                    <Button variant="secondary" size="sm" onClick={() => openBuilderDocument(document)} icon={<Pencil className="h-4 w-4" />}>
                      {t('documents:studentDocuments.edit', 'Edit')}
                    </Button>
                  ) : null}
                  <Button variant="danger" size="sm" onClick={() => handleDeleteDocument(document)} icon={<Trash2 className="h-4 w-4" />}>
                    {t('documents:studentDocuments.delete', 'Delete')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <DocumentPreviewModal
        open={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        title={previewDocument?.name ?? (previewDocument ? getDocumentTypeLabel(previewDocument.type) : t('documents:studentDocuments.documentFallback', 'Document'))}
        document={previewDocument ? {
          fileUrl: previewDocument.fileUrl,
          canvasJson: previewDocument.canvasJson,
          pageFormat: previewDocument.pageFormat,
          width: previewDocument.width,
          height: previewDocument.height,
        } : null}
      />
    </div>
  )
}
