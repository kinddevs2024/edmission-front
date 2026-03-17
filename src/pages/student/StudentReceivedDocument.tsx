import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { CelebrationModal } from '@/components/documents/CelebrationModal'
import { DocumentCanvasStage } from '@/components/documents/DocumentCanvasStage'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { StudentDecisionPanel } from '@/components/documents/StudentDecisionPanel'
import { acceptIssuedDocument, declineIssuedDocument, getIssuedDocument, postponeIssuedDocument, viewIssuedDocument } from '@/services/documents'
import { parseScene } from '@/utils/documentScene'
import { toastApiError } from '@/utils/toastError'
import type { UniversityDocumentSummary } from '@/types/documentModule'

export function StudentReceivedDocument() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [document, setDocument] = useState<UniversityDocumentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | 'postpone' | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getIssuedDocument(id)
      .then((data) => {
        setDocument(data)
        setCelebrationOpen(!data.viewedAt && data.status === 'sent')
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

  const handleViewDocument = () => {
    if (!id) return
    viewIssuedDocument(id)
      .then((data) => {
        setDocument(data)
        setCelebrationOpen(false)
      })
      .catch(toastApiError)
  }

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
        <PageTitle title="Document" icon="FileText" />
        <Card><div className="h-64 animate-pulse rounded-card bg-[var(--color-border)]" /></Card>
      </div>
    )
  }

  const canDecide = ['sent', 'viewed', 'postponed'].includes(document.status)

  return (
    <div className="space-y-4">
      <PageTitle title={document.title ?? 'Document'} icon="FileText" />

      <CelebrationModal
        open={celebrationOpen}
        universityName={document.university?.name ?? 'University'}
        type={document.type}
        onView={handleViewDocument}
        onClose={() => setCelebrationOpen(false)}
      />

      <Card className="flex flex-wrap items-start justify-between gap-3 border border-[var(--color-border)]">
        <div>
          <h2 className="text-2xl font-semibold">{document.university?.name ?? 'University'}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Deadline: {document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : 'Open ended'}</p>
        </div>
        <DocumentStatusBadge status={document.status} />
      </Card>

      <DocumentCanvasStage scene={scene} zoom={sceneZoom} />

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
          This document is closed for further actions.
        </Card>
      )}

      {document.events?.length ? (
        <Card className="space-y-3 border border-[var(--color-border)]">
          <h3 className="text-lg font-semibold">Timeline</h3>
          <div className="space-y-2">
            {document.events.map((event) => (
              <div key={event.id} className="rounded-[18px] border border-[var(--color-border)] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{event.eventType}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => navigate('/student/offers')}>Back to offers</Button>
      </div>
    </div>
  )
}
