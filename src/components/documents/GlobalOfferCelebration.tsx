import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { listIssuedDocuments } from '@/services/documents'
import { CelebrationModal } from '@/components/documents/CelebrationModal'
import type { UniversityDocumentSummary } from '@/types/documentModule'

/** Offer celebration only for documents the student has not opened yet (backend sets status + viewedAt on view). */
function needsOfferCelebration(document: UniversityDocumentSummary, dismissedId: string | null): boolean {
  if (document.id === dismissedId) return false
  if (document.viewedAt) return false
  return document.status === 'sent' || document.status === 'postponed'
}

export function GlobalOfferCelebration() {
  const { user } = useAuth()
  const { onNotification } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [documents, setDocuments] = useState<UniversityDocumentSummary[]>([])
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const refreshOffers = useCallback(() => {
    listIssuedDocuments({ type: 'offer' }).then(setDocuments).catch(() => setDocuments([]))
  }, [])

  useEffect(() => {
    if (user?.role !== 'student') return
    refreshOffers()
  }, [user?.role, location.pathname, refreshOffers])

  useEffect(() => {
    if (user?.role !== 'student') return
    return onNotification((payload) => {
      if (payload.type !== 'document' || payload.metadata?.documentType !== 'offer') return
      listIssuedDocuments({ type: 'offer' }).then((items) => {
        setDismissedId(null)
        setDocuments(items)
      }).catch(() => { })
    })
  }, [onNotification, user?.role])

  const pendingOffer = useMemo(
    () => documents.find((document) => needsOfferCelebration(document, dismissedId)),
    [documents, dismissedId]
  )

  if (user?.role !== 'student' || !pendingOffer) return null

  return (
    <CelebrationModal
      open
      universityName={pendingOffer.university?.name ?? 'University'}
      type={pendingOffer.type}
      onClose={() => setDismissedId(pendingOffer.id)}
      onView={() => {
        // Dismiss this offer in the global layer so the modal does not stay open
        // after navigation (clearing dismissedId was a bug — it re-selected the same doc).
        setDismissedId(pendingOffer.id)
        navigate(`/student/received-documents/${pendingOffer.id}`)
      }}
    />
  )
}
