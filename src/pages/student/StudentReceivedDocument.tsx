import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { DocumentCanvasStage } from '@/components/documents/DocumentCanvasStage'
import { DocumentSummaryPanel } from '@/components/documents/DocumentSummaryPanel'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { StudentDecisionPanel } from '@/components/documents/StudentDecisionPanel'
import { acceptIssuedDocument, declineIssuedDocument, getIssuedDocument, postponeIssuedDocument, viewIssuedDocument } from '@/services/documents'
import { parseScene } from '@/utils/documentScene'
import { toastApiError } from '@/utils/toastError'
import type { UniversityDocumentSummary } from '@/types/documentModule'

export function StudentReceivedDocument() {
  const { t } = useTranslation(['documents', 'common'])
  const navigate = useNavigate()
  const { id } = useParams()
  const [document, setDocument] = useState<UniversityDocumentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | 'postpone' | null>(null)
  /** One auto view-mark per document id (avoids duplicate API calls in Strict Mode). */
  const lastAutoViewDocumentId = useRef<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getIssuedDocument(id)
      .then((data) => {
        setDocument(data)
        // User is already on the document page — no second "you received an offer" modal.
        // Mark as viewed so global offer celebration and this page stay in sync.
        const shouldMarkView = data.status === 'sent' && !data.viewedAt
        const alreadySentForThisId = lastAutoViewDocumentId.current === id
        if (shouldMarkView && !alreadySentForThisId) {
          lastAutoViewDocumentId.current = id
          viewIssuedDocument(id)
            .then(setDocument)
            .catch(toastApiError)
        }
      })
      .catch((error) => {
        toastApiError(error)
        navigate('/student/offers')
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

  const runDecision = async (action: 'accept' | 'decline' | 'postpone', runner: () => Promise<UniversityDocumentSummary>) => {
    setActionLoading(action)
    try {
      const data = await runner()
      setDocument(data)
    } catch (error) {
      toastApiError(error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading || !document || !scene) {
    return (
      <div className="space-y-4">
        <PageTitle title={t('documents:common.document', 'Document')} icon="FileText" />
        <Card><div className="h-64 animate-pulse rounded-card bg-[var(--color-border)]" /></Card>
      </div>
    )
  }

  const canDecide = ['sent', 'viewed', 'postponed'].includes(document.status)

  return (
    <div className="space-y-4">
      <PageTitle title={document.title ?? t('documents:common.document', 'Document')} icon="FileText" />

      <Card className="flex flex-wrap items-start justify-between gap-3 border border-[var(--color-border)]">
        <div>
          <h2 className="text-2xl font-semibold">{document.university?.name ?? t('documents:common.university', 'University')}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{t('documents:studentDocument.deadline', 'Deadline')}: {document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : t('documents:summary.openEnded', 'Open ended')}</p>
        </div>
        <DocumentStatusBadge status={document.status} />
      </Card>

      <DocumentCanvasStage scene={scene} zoom={sceneZoom} />
      <DocumentSummaryPanel payload={document.renderedPayload} fallbackDeadline={document.expiresAt} />

      {canDecide ? (
        <StudentDecisionPanel
          disabled={Boolean(actionLoading)}
          loadingAction={actionLoading}
          onAccept={() => id && runDecision('accept', () => acceptIssuedDocument(id))}
          onDecline={() => id && runDecision('decline', () => declineIssuedDocument(id))}
          onPostpone={(days) => id && runDecision('postpone', () => postponeIssuedDocument(id, days))}
        />
      ) : (
        <Card className="border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
          {t('documents:studentDocument.closedForFurtherActions', 'This document is closed for further actions.')}
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => navigate('/student/offers')}>{t('documents:studentDocument.backToOffers', 'Back to offers')}</Button>
      </div>
    </div>
  )
}
