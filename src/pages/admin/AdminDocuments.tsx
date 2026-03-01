import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { getPendingDocuments, reviewDocument, type PendingDocumentItem } from '@/services/admin'
import { getApiError } from '@/services/auth'
import { FileText } from 'lucide-react'

export function AdminDocuments() {
  const [list, setList] = useState<PendingDocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ item: PendingDocumentItem; decision: 'approved' | 'rejected' } | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    getPendingDocuments()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleReview = () => {
    if (!modal) return
    setError('')
    setSubmitting(true)
    reviewDocument(modal.item.id, modal.decision, modal.decision === 'rejected' ? reason : undefined)
      .then(() => {
        setModal(null)
        setReason('')
        load()
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Student documents" icon="FileText" />

      <Card>
        <CardTitle>Pending review</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">No documents pending review.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border)]">
            {list.map((item) => (
              <li key={item.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
                  <div>
                    <p className="font-medium">{item.studentName || 'Student'}</p>
                    <p className="text-sm text-[var(--color-text-muted)] capitalize">{item.type?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-accent hover:underline"
                  >
                    View file
                  </a>
                  <Button size="sm" onClick={() => setModal({ item, decision: 'approved' })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setModal({ item, decision: 'rejected' })}>
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!modal}
        onClose={() => { setModal(null); setReason(''); setError('') }}
        title={modal?.decision === 'approved' ? 'Approve document' : 'Reject document'}
        footer={
          modal ? (
            <>
              <Button variant="secondary" onClick={() => { setModal(null); setReason('') }}>Cancel</Button>
              <Button
                variant={modal.decision === 'rejected' ? 'danger' : 'primary'}
                onClick={handleReview}
                disabled={submitting}
                loading={submitting}
              >
                {modal.decision === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </>
          ) : undefined
        }
      >
        {modal && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {modal.item.studentName} — {modal.item.type?.replace(/_/g, ' ')}
            </p>
            {modal.decision === 'rejected' && (
              <label className="block">
                <span className="block text-sm font-medium mb-1">Rejection reason (optional)</span>
                <textarea
                  className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 text-sm"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for rejection"
                  aria-label="Rejection reason"
                />
              </label>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
