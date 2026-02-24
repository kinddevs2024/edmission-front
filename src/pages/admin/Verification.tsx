import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getVerificationQueue, approveUniversity, rejectUniversity } from '@/services/admin'
import { formatDate } from '@/utils/format'
import type { VerificationItem } from '@/services/admin'

export function Verification() {
  const [list, setList] = useState<VerificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; item: VerificationItem } | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getVerificationQueue()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = () => {
    if (!actionModal) return
    setSubmitting(true)
    approveUniversity(actionModal.item.universityId, comment || undefined)
      .then(() => {
        setActionModal(null)
        setComment('')
        load()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  const handleReject = () => {
    if (!actionModal) return
    setSubmitting(true)
    rejectUniversity(actionModal.item.universityId, comment || undefined)
      .then(() => {
        setActionModal(null)
        setComment('')
        load()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-h1">University Verification</h1>

      <Card>
        <CardTitle>Queue</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">Loading...</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">No universities pending verification.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {list.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{item.email}</p>
                    {item.country && <p className="text-sm text-[var(--color-text-muted)]">{item.country}</p>}
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Submitted: {formatDate(item.submittedAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => setActionModal({ type: 'approve', item })}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => setActionModal({ type: 'reject', item })}>Reject</Button>
                  </div>
                </div>
                {item.documents && item.documents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)]">Documents:</p>
                    <ul className="text-sm">
                      {item.documents.map((d, i) => (
                        <li key={i}>
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline">{d.name}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={!!actionModal}
        onClose={() => { setActionModal(null); setComment('') }}
        title={actionModal?.type === 'approve' ? 'Approve university' : 'Reject university'}
        footer={
          actionModal ? (
            <>
              <Button variant="secondary" onClick={() => { setActionModal(null); setComment('') }}>Cancel</Button>
              {actionModal.type === 'approve' ? (
                <Button onClick={handleApprove} disabled={submitting}>{submitting ? 'Saving...' : 'Approve'}</Button>
              ) : (
                <Button variant="danger" onClick={handleReject} disabled={submitting}>{submitting ? 'Saving...' : 'Reject'}</Button>
              )}
            </>
          ) : undefined
        }
      >
        {actionModal && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">{actionModal.item.name}</p>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Comment (optional)</span>
              <textarea
                className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 text-sm"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
              />
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}
