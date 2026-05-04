import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { DocumentCanvasStage } from '@/components/documents/DocumentCanvasStage'
import { DocumentSummaryPanel } from '@/components/documents/DocumentSummaryPanel'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { getIssuedDocument } from '@/services/documents'
import { parseScene } from '@/utils/documentScene'
import { toastApiError } from '@/utils/toastError'
import type { UniversityDocumentSummary } from '@/types/documentModule'

export function CounsellorOfferDetail() {
  const { t } = useTranslation(['documents', 'common', 'school'])
  const navigate = useNavigate()
  const { id } = useParams()
  const [document, setDocument] = useState<UniversityDocumentSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getIssuedDocument(id)
      .then(setDocument)
      .catch((error) => {
        toastApiError(error)
        navigate('/school/offers')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const scene = useMemo(
    () => document
      ? parseScene(
          document.resolvedCanvasJson ?? document.frozenTemplateJson,
          document.pageFormat ?? 'A4_PORTRAIT',
          document.width,
          document.height
        )
      : null,
    [document]
  )
  const sceneZoom = scene ? (scene.page.width > scene.page.height ? 0.32 : 0.45) : 0.45

  if (loading || !document || !scene) {
    return (
      <div className="space-y-4">
        <PageTitle title={t('documents:common.document', 'Document')} icon="FileText" />
        <Card><div className="h-64 animate-pulse rounded-card bg-[var(--color-border)]" /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle title={document.title ?? t('documents:common.document', 'Document')} icon="FileText" />

      <Card className="flex flex-wrap items-start justify-between gap-3 border border-[var(--color-border)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {document.type === 'offer' ? t('documents:type.offer', 'Offer') : t('documents:type.scholarship', 'Scholarship')}
          </p>
          <h2 className="mt-1 text-2xl font-semibold">{document.university?.name ?? t('documents:common.university', 'University')}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('documents:studentDocument.deadline', 'Deadline')}: {document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : t('documents:summary.openEnded', 'Open ended')}
          </p>
        </div>
        <DocumentStatusBadge status={document.status} />
      </Card>

      <DocumentCanvasStage scene={scene} zoom={sceneZoom} />
      <DocumentSummaryPanel payload={document.renderedPayload} fallbackDeadline={document.expiresAt} />

      <Card className="border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
        {t('school:counsellorOfferReadOnlyHint', 'This is a read-only counsellor view. The student keeps control of accepting, declining, or postponing the offer.')}
      </Card>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => navigate('/school/offers')}>{t('school:backToOffers', 'Back to offers')}</Button>
      </div>
    </div>
  )
}
