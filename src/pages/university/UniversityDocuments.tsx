import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import type { AdminUniversityDocumentsOutletContext } from '@/pages/admin/AdminUniversityDocumentsLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { DocumentCanvasStage } from '@/components/documents/DocumentCanvasStage'
import { DocumentSummaryPanel } from '@/components/documents/DocumentSummaryPanel'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { TemplateCard } from '@/components/documents/TemplateCard'
import { Modal } from '@/components/ui/Modal'
import {
  adminUniversityCreateDocumentTemplate,
  adminUniversityDeleteIssuedDocument,
  adminUniversityDuplicateDocumentTemplate,
  adminUniversityGetDocumentTemplates,
  adminUniversityGetIssuedDocument,
  adminUniversityListIssuedDocuments,
  adminUniversityRevokeIssuedDocument,
  adminUniversityUpdateDocumentTemplate,
} from '@/services/admin'
import {
  createDocumentTemplate,
  deleteIssuedDocument,
  duplicateDocumentTemplate,
  getIssuedDocument,
  getDocumentTemplates,
  listIssuedDocuments,
  revokeIssuedDocument,
  updateDocumentTemplate,
} from '@/services/documents'
import { uploadFile } from '@/services/upload'
import { useDocumentEditorStore } from '@/store/documentEditorStore'
import { createBlankScene, parseScene, stringifyScene } from '@/utils/documentScene'
import { toastApiError } from '@/utils/toastError'
import type { DocumentPageFormat, DocumentTemplate, DocumentType, UniversityDocumentSummary } from '@/types/documentModule'
import { UploadCloud } from 'lucide-react'

type DocumentsTab = 'templates' | 'sent' | 'drafts' | 'settings'

export function UniversityDocuments() {
  const { t } = useTranslation(['documents', 'common'])
  const navigate = useNavigate()
  const outlet = useOutletContext<AdminUniversityDocumentsOutletContext | null>()
  const adminUniversityUserId = outlet?.adminUniversityUserId
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<DocumentsTab>('templates')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [documents, setDocuments] = useState<UniversityDocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'offer' | 'scholarship'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'archived'>('all')
  const [selectedDocument, setSelectedDocument] = useState<UniversityDocumentSummary | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadingTemplate, setUploadingTemplate] = useState(false)
  const [templateUploadFile, setTemplateUploadFile] = useState<File | null>(null)
  const [templateUploadPreview, setTemplateUploadPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const resetEditor = useDocumentEditorStore((state) => state.reset)
  const setEditorMeta = useDocumentEditorStore((state) => state.setMetadata)
  const addEditorElement = useDocumentEditorStore((state) => state.addElement)

  const loadTemplates = useCallback(() => {
    const params = {
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }
    const req = adminUniversityUserId
      ? adminUniversityGetDocumentTemplates(adminUniversityUserId, params)
      : getDocumentTemplates(params)
    return req
      .then(setTemplates)
      .catch((error) => {
        toastApiError(error)
        setTemplates([])
      })
  }, [adminUniversityUserId, typeFilter, statusFilter])

  const loadDocuments = useCallback(() => {
    const params = typeFilter === 'all' ? undefined : { type: typeFilter }
    const req = adminUniversityUserId
      ? adminUniversityListIssuedDocuments(adminUniversityUserId, params)
      : listIssuedDocuments(params)
    return req
      .then(setDocuments)
      .catch((error) => {
        toastApiError(error)
        setDocuments([])
      })
  }, [adminUniversityUserId, typeFilter])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadTemplates(), loadDocuments()]).finally(() => setLoading(false))
  }, [loadTemplates, loadDocuments])

  useEffect(() => {
    const documentId = searchParams.get('documentId')
    if (!documentId) return
    setTab('sent')
    openDocumentDetail(documentId)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const draftTemplates = useMemo(
    () => templates.filter((template) => template.status === 'draft'),
    [templates]
  )

  const detailScene = selectedDocument
    ? parseScene(
        selectedDocument.resolvedCanvasJson ?? selectedDocument.frozenTemplateJson,
        selectedDocument.pageFormat ?? 'A4_PORTRAIT',
        selectedDocument.width,
        selectedDocument.height
      )
    : null
  const detailZoom = detailScene ? (detailScene.page.width > detailScene.page.height ? 0.19 : 0.24) : 0.24

  const openDocumentDetail = useCallback(
    (id: string) => {
      setDetailLoading(true)
      const req = adminUniversityUserId
        ? adminUniversityGetIssuedDocument(adminUniversityUserId, id)
        : getIssuedDocument(id)
      req
        .then(setSelectedDocument)
        .catch(toastApiError)
        .finally(() => setDetailLoading(false))
    },
    [adminUniversityUserId]
  )

  const handleArchive = (template: DocumentTemplate) => {
    const req = adminUniversityUserId
      ? adminUniversityUpdateDocumentTemplate(adminUniversityUserId, template.id, { status: 'archived' })
      : updateDocumentTemplate(template.id, { status: 'archived' })
    req.then(() => loadTemplates()).catch(toastApiError)
  }

  const handleSetDefault = (template: DocumentTemplate) => {
    const req = adminUniversityUserId
      ? adminUniversityUpdateDocumentTemplate(adminUniversityUserId, template.id, { isDefault: true, status: 'active' })
      : updateDocumentTemplate(template.id, { isDefault: true, status: 'active' })
    req.then(() => loadTemplates()).catch(toastApiError)
  }

  const goNewTemplate = () => {
    navigate(adminUniversityUserId ? 'templates/new' : '/university/documents/templates/new')
  }

  const goEditTemplate = (templateId: string) => {
    navigate(
      adminUniversityUserId
        ? `templates/${templateId}/edit`
        : `/university/documents/templates/${templateId}/edit`
    )
  }

  const duplicateTemplate = (templateId: string) => {
    const req = adminUniversityUserId
      ? adminUniversityDuplicateDocumentTemplate(adminUniversityUserId, templateId)
      : duplicateDocumentTemplate(templateId)
    return req.then(() => loadTemplates())
  }

  const handleUploadTemplateBackground = async () => {
    if (!templateUploadFile) return
    setUploadingTemplate(true)
    try {
      const pageConfig = await resolvePageConfig(templateUploadFile)
      const fileUrl = await uploadFile(templateUploadFile)
      resetEditor({
        type: typeFilter === 'scholarship' ? 'scholarship' : 'offer',
        pageFormat: pageConfig.pageFormat,
        width: pageConfig.width,
        height: pageConfig.height,
      })
      const nextScene = useDocumentEditorStore.getState().scene
      setEditorMeta({
        name: templateUploadFile.name.replace(/\.[^.]+$/, ''),
        assets: [
          {
            type: templateUploadFile.type === 'application/pdf' ? 'pdf_background' : 'background',
            fileUrl,
            fileName: templateUploadFile.name,
            mimeType: templateUploadFile.type || 'application/octet-stream',
          },
        ],
      })
      if (templateUploadFile.type !== 'application/pdf') {
        addEditorElement({
          id: `background-${Date.now()}`,
          type: 'image',
          x: 0,
          y: 0,
          width: nextScene.page.width,
          height: nextScene.page.height,
          src: fileUrl,
          locked: true,
          layer: -1,
        })
      }
      setUploadModalOpen(false)
      setTemplateUploadFile(null)
      if (templateUploadPreview) {
        URL.revokeObjectURL(templateUploadPreview)
        setTemplateUploadPreview('')
      }
      goNewTemplate()
    } catch (error) {
      toastApiError(error)
    } finally {
      setUploadingTemplate(false)
    }
  }

  const handleSaveTemplateFromUpload = async () => {
    if (!templateUploadFile) return
    setUploadingTemplate(true)
    try {
      const pageConfig = await resolvePageConfig(templateUploadFile)
      const fileUrl = await uploadFile(templateUploadFile)
      const scene = createBlankScene(pageConfig.pageFormat, pageConfig.width, pageConfig.height)
      if (templateUploadFile.type !== 'application/pdf') {
        scene.elements.push({
          id: `background-${Date.now()}`,
          type: 'image',
          x: 0,
          y: 0,
          width: scene.page.width,
          height: scene.page.height,
          src: fileUrl,
          locked: true,
          layer: -1,
        })
      }
      const docType: DocumentType = typeFilter === 'scholarship' ? 'scholarship' : 'offer'
      const assetType = (templateUploadFile.type === 'application/pdf' ? 'pdf_background' : 'background') as
        | 'pdf_background'
        | 'background'
      const payload = {
        name: templateUploadFile.name.replace(/\.[^.]+$/, '') || 'Template',
        type: docType,
        status: 'draft' as const,
        pageFormat: scene.page.format,
        width: scene.page.width,
        height: scene.page.height,
        editorVersion: '1.0.0',
        canvasJson: stringifyScene(scene),
        assets: [
          {
            type: assetType,
            fileUrl,
            fileName: templateUploadFile.name,
            mimeType: templateUploadFile.type || 'application/octet-stream',
            width: scene.page.width,
            height: scene.page.height,
          },
        ],
      }
      if (adminUniversityUserId) {
        await adminUniversityCreateDocumentTemplate(adminUniversityUserId, payload)
      } else {
        await createDocumentTemplate(payload)
      }
      setUploadModalOpen(false)
      setTemplateUploadFile(null)
      if (templateUploadPreview) {
        URL.revokeObjectURL(templateUploadPreview)
        setTemplateUploadPreview('')
      }
      await loadTemplates()
    } catch (error) {
      toastApiError(error)
    } finally {
      setUploadingTemplate(false)
    }
  }

  const tabs: Array<{ id: DocumentsTab; label: string }> = [
    { id: 'templates', label: t('documents:universityDocuments.tabs.templates', 'Templates') },
    { id: 'sent', label: t('documents:universityDocuments.tabs.sent', 'Sent documents') },
    { id: 'drafts', label: t('documents:universityDocuments.tabs.drafts', 'Drafts') },
    { id: 'settings', label: t('documents:universityDocuments.tabs.settings', 'Settings') },
  ]

  return (
    <>
    <div className="space-y-4">
      <PageTitle title={t('documents:universityDocuments.pageTitle', 'Documents')} icon="FileText" />
      {adminUniversityUserId ? (
        <p className="text-sm text-amber-700 dark:text-amber-300 rounded-input border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          {t('documents:universityDocuments.adminActingBanner', 'You are managing document templates and sent offers for this university account.')}
        </p>
      ) : null}

      <Card className="flex flex-wrap items-center justify-between gap-3 border border-[var(--color-border)]">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <Button key={item.id} variant={tab === item.id ? 'primary' : 'secondary'} size="sm" onClick={() => setTab(item.id)}>
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={typeFilter === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setTypeFilter('all')}>{t('common:all', 'All')}</Button>
          <Button variant={typeFilter === 'offer' ? 'primary' : 'secondary'} size="sm" onClick={() => setTypeFilter('offer')}>{t('documents:type.offer', 'Offer')}</Button>
          <Button variant={typeFilter === 'scholarship' ? 'primary' : 'secondary'} size="sm" onClick={() => setTypeFilter('scholarship')}>{t('documents:type.scholarship', 'Scholarship')}</Button>
        </div>
      </Card>

      {tab === 'templates' ? (
        <Card className="space-y-4 border border-[var(--color-border)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant={statusFilter === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setStatusFilter('all')}>{t('common:all', 'All')}</Button>
              <Button variant={statusFilter === 'draft' ? 'primary' : 'secondary'} size="sm" onClick={() => setStatusFilter('draft')}>{t('documents:templateStatus.draft', 'Draft')}</Button>
              <Button variant={statusFilter === 'active' ? 'primary' : 'secondary'} size="sm" onClick={() => setStatusFilter('active')}>{t('documents:templateStatus.active', 'Active')}</Button>
              <Button variant={statusFilter === 'archived' ? 'primary' : 'secondary'} size="sm" onClick={() => setStatusFilter('archived')}>{t('documents:templateStatus.archived', 'Archived')}</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setUploadModalOpen(true)}>
                {t('documents:universityDocuments.uploadDocument', 'Upload document')}
              </Button>
              <Button onClick={goNewTemplate}>{t('documents:universityDocuments.createTemplate', 'Create template')}</Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
          ) : templates.length === 0 ? (
            <Card className="border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
              {t('documents:universityDocuments.noTemplatesYet', 'No templates yet.')}
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => goEditTemplate(template.id)}
                  onDuplicate={() => duplicateTemplate(template.id).catch(toastApiError)}
                  onArchive={() => handleArchive(template)}
                  onSetDefault={() => handleSetDefault(template)}
                  onSelect={() => goEditTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {tab === 'sent' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="space-y-4 border border-[var(--color-border)]">
            {documents.length === 0 ? (
              <Card className="border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                {t('documents:universityDocuments.noSentDocumentsYet', 'No sent documents yet.')}
              </Card>
            ) : (
              documents.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  className="w-full rounded-[24px] border border-[var(--color-border)] p-4 text-left hover:border-primary-accent"
                  onClick={() => openDocumentDetail(document.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold">{document.title ?? t('documents:common.document', 'Document')}</h3>
                      <p className="text-sm text-[var(--color-text-muted)]">{document.student?.fullName ?? t('documents:common.student', 'Student')}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{t('documents:universityDocuments.sentOn', { date: new Date(document.sentAt).toLocaleString(), defaultValue: 'Sent {{date}}' })}</p>
                    </div>
                    <DocumentStatusBadge status={document.status} />
                  </div>
                </button>
              ))
            )}
          </Card>

          <Card className="space-y-4 border border-[var(--color-border)]">
            {detailLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t('documents:universityDocuments.loadingDocumentDetails', 'Loading document details...')}</p>
            ) : selectedDocument && detailScene ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedDocument.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">{selectedDocument.student?.fullName}</p>
                  </div>
                  <DocumentStatusBadge status={selectedDocument.status} />
                </div>
                <DocumentCanvasStage scene={detailScene} zoom={detailZoom} />
                <DocumentSummaryPanel payload={selectedDocument.renderedPayload} fallbackDeadline={selectedDocument.expiresAt} />
                {selectedDocument.events?.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">{t('documents:common.audit', 'Audit')}</p>
                    <div className="space-y-2">
                      {selectedDocument.events.map((event) => (
                        <div key={event.id} className="rounded-[18px] border border-[var(--color-border)] px-3 py-2 text-sm">
                          <p className="font-medium">{event.eventType}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{new Date(event.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {['sent', 'viewed', 'postponed'].includes(selectedDocument.status) ? (
                  <Button
                    variant="danger"
                    onClick={() => {
                      const req = adminUniversityUserId
                        ? adminUniversityRevokeIssuedDocument(adminUniversityUserId, selectedDocument.id)
                        : revokeIssuedDocument(selectedDocument.id)
                      req
                        .then((doc) => {
                          setSelectedDocument(doc)
                          loadDocuments()
                        })
                        .catch(toastApiError)
                    }}
                  >
                    {t('documents:universityDocuments.revokeDocument', 'Revoke document')}
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!window.confirm(t('documents:universityDocuments.deleteConfirm', { title: selectedDocument.title ?? t('documents:common.document', 'Document'), defaultValue: 'Delete "{{title}}" from Documents?' }))) return
                    const del = adminUniversityUserId
                      ? adminUniversityDeleteIssuedDocument(adminUniversityUserId, selectedDocument.id)
                      : deleteIssuedDocument(selectedDocument.id)
                    del
                      .then(() => {
                        setSelectedDocument(null)
                        loadDocuments()
                      })
                      .catch(toastApiError)
                  }}
                >
                  {t('documents:universityDocuments.deleteFromList', 'Delete from list')}
                </Button>
              </>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
                {t('documents:universityDocuments.selectDocumentToInspect', 'Select any sent document to inspect its snapshot and audit trail.')}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {tab === 'drafts' ? (
        <Card className="space-y-4 border border-[var(--color-border)]">
          {draftTemplates.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t('documents:universityDocuments.noDrafts', 'No drafts.')}</p>
          ) : (
            draftTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => goEditTemplate(template.id)}
                onDuplicate={() => duplicateTemplate(template.id).catch(toastApiError)}
                onArchive={() => handleArchive(template)}
                onSetDefault={() => handleSetDefault(template)}
              />
            ))
          )}
        </Card>
      ) : null}

      {tab === 'settings' ? (
        <Card className="space-y-4 border border-[var(--color-border)]">
          <div>
            <h3 className="text-lg font-semibold">{t('documents:universityDocuments.moduleDecisions', 'Module decisions')}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">{t('documents:universityDocuments.moduleDecisionsText', 'Unified documents engine, one editor for offer/scholarship, single postpone flow, snapshot storage, expired distinct from declined.')}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--color-border)] p-4">
              <p className="text-sm font-semibold">{t('documents:universityDocuments.defaultOfferTemplate', 'Default offer template')}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{templates.find((template) => template.type === 'offer' && template.isDefault)?.name ?? t('documents:universityDocuments.notSet', 'Not set')}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] p-4">
              <p className="text-sm font-semibold">{t('documents:universityDocuments.defaultScholarshipTemplate', 'Default scholarship template')}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{templates.find((template) => template.type === 'scholarship' && template.isDefault)?.name ?? t('documents:universityDocuments.notSet', 'Not set')}</p>
            </div>
          </div>
          <div className="rounded-[24px] border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
            {t('documents:universityDocuments.settingsFootnote', 'Deleting a template does not affect already sent documents because every student document stores its own frozen snapshot and rendered payload.')}
          </div>
        </Card>
      ) : null}

    </div>
    
    <Modal
      open={uploadModalOpen}
      onClose={() => setUploadModalOpen(false)}
      title={t('documents:universityDocuments.uploadDocument', 'Upload document')}
      footer={
        <>
          <Button variant="secondary" onClick={() => setUploadModalOpen(false)}>{t('common:cancel', 'Cancel')}</Button>
          <Button variant="secondary" onClick={handleSaveTemplateFromUpload} disabled={!templateUploadFile || uploadingTemplate} loading={uploadingTemplate}>
            {t('common:save', 'Save')}
          </Button>
          <Button onClick={handleUploadTemplateBackground} disabled={!templateUploadFile || uploadingTemplate} loading={uploadingTemplate}>
            {t('documents:universityDocuments.continueToEditor', 'Continue to editor')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs,.pdf,application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            setTemplateUploadFile(file)
            if (templateUploadPreview) URL.revokeObjectURL(templateUploadPreview)
            setTemplateUploadPreview(file ? URL.createObjectURL(file) : '')
            event.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group w-full rounded-card border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)]/70 p-8 text-center transition-colors hover:border-primary-accent hover:bg-primary-accent/5"
        >
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2">
            <UploadCloud className="h-8 w-8 text-[var(--color-text-muted)] group-hover:text-primary-accent" />
            <p className="text-sm font-medium text-[var(--color-text)]">
              {t('documents:universityDocuments.uploadDropzoneTitle', 'Click to choose a file')}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('documents:universityDocuments.uploadDropzoneHint', 'Image or PDF works best as template background')}
            </p>
          </div>
        </button>
        {templateUploadFile ? (
          <p className="text-sm text-[var(--color-text-muted)] break-all">{templateUploadFile.name}</p>
        ) : null}
        {templateUploadFile && templateUploadPreview ? (
          templateUploadFile.type.startsWith('image/') ? (
            <img src={templateUploadPreview} alt="" className="w-full max-h-72 rounded-card object-cover bg-[var(--color-border)]/30" />
          ) : (
            <div className="rounded-card border border-dashed border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
              {t('documents:universityDocuments.fileSelected', 'File selected and ready to continue')}
            </div>
          )
        ) : null}
      </div>
    </Modal>
    </>
  )
}

async function resolvePageConfig(file: File): Promise<{ pageFormat: DocumentPageFormat; width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) {
    return { pageFormat: 'A4_PORTRAIT' }
  }
  try {
    const dimensions = await getImageDimensions(file)
    return {
      pageFormat: 'CUSTOM',
      width: Math.max(320, Math.round(dimensions.width)),
      height: Math.max(320, Math.round(dimensions.height)),
    }
  } catch {
    return { pageFormat: 'A4_PORTRAIT' }
  }
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height
      URL.revokeObjectURL(objectUrl)
      if (!width || !height) {
        reject(new Error('Invalid image dimensions'))
        return
      }
      resolve({ width, height })
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }
    image.src = objectUrl
  })
}
