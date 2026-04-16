import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import type { AdminUniversityDocumentsOutletContext } from '@/pages/admin/AdminUniversityDocumentsLayout'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { DocumentEditor } from '@/components/documents/DocumentEditor'
import { adminUniversityCreateDocumentTemplate, adminUniversityGetDocumentTemplate, adminUniversityUpdateDocumentTemplate } from '@/services/admin'
import { createDocumentTemplate, getDocumentTemplate, updateDocumentTemplate } from '@/services/documents'
import { useDocumentEditorStore } from '@/store/documentEditorStore'
import { DOCUMENT_PAGE_FORMATS } from '@/utils/documentScene'
import { toastApiError } from '@/utils/toastError'
import type { DocumentPageFormat, DocumentType } from '@/types/documentModule'

export function DocumentTemplateEditorPage() {
  const navigate = useNavigate()
  const outlet = useOutletContext<AdminUniversityDocumentsOutletContext | null>()
  const adminUniversityUserId = outlet?.adminUniversityUserId
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const reset = useDocumentEditorStore((state) => state.reset)
  const loadTemplate = useDocumentEditorStore((state) => state.loadTemplate)
  const metadata = useDocumentEditorStore((state) => state.metadata)
  const setMetadata = useDocumentEditorStore((state) => state.setMetadata)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) {
      reset({
        type: (searchParams.get('type') as DocumentType | null) ?? 'offer',
        pageFormat: (searchParams.get('format') as DocumentPageFormat | null) ?? 'A4_PORTRAIT',
      })
      setLoading(false)
      return
    }
    setLoading(true)
    const req = adminUniversityUserId
      ? adminUniversityGetDocumentTemplate(adminUniversityUserId, id)
      : getDocumentTemplate(id)
    req
      .then((template) => loadTemplate(template))
      .catch((error) => {
        toastApiError(error)
        navigate(adminUniversityUserId ? `/admin/users/${adminUniversityUserId}/university-documents` : '/university/documents')
      })
      .finally(() => setLoading(false))
  }, [id, loadTemplate, navigate, reset, searchParams, adminUniversityUserId])

  if (loading) {
    return (
      <div className="space-y-4">
        <PageTitle title="Template editor" icon="FileText" />
        <Card><div className="h-40 animate-pulse rounded-card bg-[var(--color-border)]" /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle title={id ? 'Edit template' : 'Create template'} icon="FileText" />

      {!id ? (
        <Card className="grid gap-3 md:grid-cols-3 border border-[var(--color-border)]">
          <Input label="Template name" value={metadata.name} onChange={(event) => setMetadata({ name: event.target.value })} />
          <Select
            label="Document type"
            value={metadata.type}
            onChange={(event) => {
              const type = event.target.value as DocumentType
              setMetadata({ type })
            }}
            options={[
              { value: 'offer', label: 'Offer' },
              { value: 'scholarship', label: 'Scholarship' },
            ]}
          />
          <Select
            label="Page format"
            value={metadata.pageFormat}
            onChange={(event) => {
              reset({
                type: metadata.type,
                pageFormat: event.target.value as DocumentPageFormat,
              })
            }}
            options={DOCUMENT_PAGE_FORMATS}
          />
        </Card>
      ) : (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() =>
              navigate(
                adminUniversityUserId
                  ? `/admin/users/${adminUniversityUserId}/university-documents`
                  : '/university/documents'
              )
            }
          >
            Back to Documents
          </Button>
        </div>
      )}

      <DocumentEditor
        saving={saving}
        onSave={async (payload) => {
          setSaving(true)
          try {
            const templatePayload = {
              ...payload,
              type: payload.type as DocumentType,
            }
            if (id) {
              if (adminUniversityUserId) {
                await adminUniversityUpdateDocumentTemplate(adminUniversityUserId, id, templatePayload)
              } else {
                await updateDocumentTemplate(id, templatePayload)
              }
            } else if (adminUniversityUserId) {
              await adminUniversityCreateDocumentTemplate(adminUniversityUserId, templatePayload as { type: DocumentType; name: string })
            } else {
              await createDocumentTemplate(templatePayload as { type: DocumentType; name: string })
            }
            navigate(
              adminUniversityUserId
                ? `/admin/users/${adminUniversityUserId}/university-documents`
                : '/university/documents'
            )
          } catch (error) {
            toastApiError(error)
          } finally {
            setSaving(false)
          }
        }}
      />
    </div>
  )
}
