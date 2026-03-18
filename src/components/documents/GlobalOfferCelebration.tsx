import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { listIssuedDocuments } from '@/services/documents'
import { CelebrationModal } from '@/components/documents/CelebrationModal'
import type { UniversityDocumentSummary } from '@/types/documentModule'

const ACTIVE_STATUSES: UniversityDocumentSummary['status'][] = ['sent', 'viewed', 'postponed']

export function GlobalOfferCelebration() {
  const { user } = useAuth()
  const { onNotification } = useSocket()
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<UniversityDocumentSummary[]>([])
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'student') return
    listIssuedDocuments({ type: 'offer' }).then(setDocuments).catch(() => setDocuments([]))
  }, [user?.role])

  useEffect(() => {
    if (user?.role !== 'student') return
    return onNotification((payload) => {
      if (payload.type !== 'document' || payload.metadata?.documentType !== 'offer') return
      listIssuedDocuments({ type: 'offer' }).then((items) => {
        setDismissedId(null)
        setDocuments(items)
      }).catch(() => {})
    })
  }, [onNotification, user?.role])

  const pendingOffer = useMemo(
    () => documents.find((document) => ACTIVE_STATUSES.includes(document.status) && document.id !== dismissedId),
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
        setDismissedId(null)
        navigate(`/student/received-documents/${pendingOffer.id}`)
      }}
    />
  )
}
