import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { DocumentCanvasStage } from '@/components/documents/DocumentCanvasStage'
import { DocumentSummaryPanel } from '@/components/documents/DocumentSummaryPanel'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { TemplateCard } from '@/components/documents/TemplateCard'
import { deleteIssuedDocument, duplicateDocumentTemplate, getIssuedDocument, getDocumentTemplates, listIssuedDocuments, revokeIssuedDocument, updateDocumentTemplate } from '@/services/documents'
import { parseScene } from '@/utils/documentScene'
import { toastApiError } from '@/utils/toastError'
import type { DocumentTemplate, UniversityDocumentSummary } from '@/types/documentModule'

type DocumentsTab = 'templates' | 'sent' | 'drafts' | 'settings'

export function UniversityDocuments() {
  const { t } = useTranslation(['documents', 'common'])
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<DocumentsTab>('templates')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [documents, setDocuments] = useState<UniversityDocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'offer' | 'scholarship'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'archived'>('all')
  const [selectedDocument, setSelectedDocument] = useState<UniversityDocumentSummary | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadTemplates = () =>
    getDocumentTemplates({
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    })
      .then(setTemplates)
      .catch((error) => {
        toastApiError(error)
        setTemplates([])
      })

  const loadDocuments = () =>
    listIssuedDocuments(typeFilter === 'all' ? undefined : { type: typeFilter })
      .then(setDocuments)
      .catch((error) => {
        toastApiError(error)
        setDocuments([])
      })

  useEffect(() => {
    setLoading(true)
    Promise.all([loadTemplates(), loadDocuments()]).finally(() => setLoading(false))
  }, [typeFilter, statusFilter])

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

  const openDocumentDetail = (id: string) => {
    setDetailLoading(true)
    getIssuedDocument(id)
      .then(setSelectedDocument)
      .catch(toastApiError)
      .finally(() => setDetailLoading(false))
  }

  const handleArchive = (template: DocumentTemplate) => {
    updateDocumentTemplate(template.id, { status: 'archived' })
      .then(() => loadTemplates())
      .catch(toastApiError)
  }

  const handleSetDefault = (template: DocumentTemplate) => {
    updateDocumentTemplate(template.id, { isDefault: true, status: 'active' })
      .then(() => loadTemplates())
      .catch(toastApiError)
  }

  const tabs: Array<{ id: DocumentsTab; label: string }> = [
    { id: 'templates', label: t('documents:universityDocuments.tabs.templates', 'Templates') },
    { id: 'sent', label: t('documents:universityDocuments.tabs.sent', 'Sent documents') },
    { id: 'drafts', label: t('documents:universityDocuments.tabs.drafts', 'Drafts') },
    { id: 'settings', label: t('documents:universityDocuments.tabs.settings', 'Settings') },
  ]

  return (
    <div className="space-y-4">
      <PageTitle title={t('documents:universityDocuments.pageTitle', 'Documents')} icon="FileText" />

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
            <Button onClick={() => navigate('/university/documents/templates/new')}>{t('documents:universityDocuments.createTemplate', 'Create template')}</Button>
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
                  onEdit={() => navigate(`/university/documents/templates/${template.id}/edit`)}
                  onDuplicate={() => duplicateDocumentTemplate(template.id).then(loadTemplates).catch(toastApiError)}
                  onArchive={() => handleArchive(template)}
                  onSetDefault={() => handleSetDefault(template)}
                  onSelect={() => navigate(`/university/documents/templates/${template.id}/edit`)}
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
                  <Button variant="danger" onClick={() => revokeIssuedDocument(selectedDocument.id).then((doc) => { setSelectedDocument(doc); loadDocuments() }).catch(toastApiError)}>
                    {t('documents:universityDocuments.revokeDocument', 'Revoke document')}
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!window.confirm(t('documents:universityDocuments.deleteConfirm', { title: selectedDocument.title ?? t('documents:common.document', 'Document'), defaultValue: 'Delete "{{title}}" from Documents?' }))) return
                    deleteIssuedDocument(selectedDocument.id)
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
                onEdit={() => navigate(`/university/documents/templates/${template.id}/edit`)}
                onDuplicate={() => duplicateDocumentTemplate(template.id).then(loadTemplates).catch(toastApiError)}
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
  )
}
