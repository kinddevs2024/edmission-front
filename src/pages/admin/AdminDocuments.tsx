import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { PageTitle } from '@/components/ui/PageTitle'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import { getPendingDocuments, reviewDocument, type PendingDocumentItem } from '@/services/admin'
import { getApiError } from '@/services/auth'
import { toastApiError } from '@/utils/toastError'
import { FileText } from 'lucide-react'

export function AdminDocuments() {
  const { t } = useTranslation(['common', 'admin'])
  const [list, setList] = useState<PendingDocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ item: PendingDocumentItem; decision: 'approved' | 'rejected' } | null>(null)
  const [previewItem, setPreviewItem] = useState<PendingDocumentItem | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    getPendingDocuments()
      .then(setList)
      .catch((e) => { toastApiError(e); setList([]) })
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
      <PageTitle title={t('admin:studentDocuments', 'Student documents')} icon="FileText" />

      <Card>
        <CardTitle>{t('admin:pendingReview')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">{t('admin:noPendingDocuments')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border)]">
            {list.map((item) => (
              <li key={item.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
                  <div>
                    <p className="font-medium">{item.studentName || t('admin:studentLabel', 'Student')}</p>
                    <p className="text-sm text-[var(--color-text-muted)] capitalize">{item.type?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-sm text-primary-accent hover:underline" onClick={() => setPreviewItem(item)}>
                    {t('common:preview', 'Preview')}
                  </button>
                  <Button size="sm" onClick={() => setModal({ item, decision: 'approved' })}>
                    {t('admin:approve')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setModal({ item, decision: 'rejected' })}>
                    {t('admin:reject')}
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
        title={modal?.decision === 'approved' ? t('admin:approveDocument', 'Approve document') : t('admin:rejectDocument', 'Reject document')}
        footer={
          modal ? (
            <>
              <Button variant="secondary" onClick={() => { setModal(null); setReason('') }}>{t('common:cancel')}</Button>
              <Button
                variant={modal.decision === 'rejected' ? 'danger' : 'primary'}
                onClick={handleReview}
                disabled={submitting}
                loading={submitting}
              >
                {modal.decision === 'approved' ? t('admin:approve') : t('admin:reject')}
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
              <Textarea
                label={t('admin:rejectionReasonOptional', 'Rejection reason (optional)')}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('admin:reasonForRejection', 'Reason for rejection')}
                aria-label={t('admin:rejectionReasonOptional')}
              />
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </Modal>

      <DocumentPreviewModal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.name ?? previewItem?.type ?? t('admin:documentLabel', 'Document')}
        document={previewItem ? {
          fileUrl: previewItem.fileUrl,
          canvasJson: previewItem.canvasJson,
          pageFormat: previewItem.pageFormat,
          width: previewItem.width,
          height: previewItem.height,
        } : null}
      />
    </div>
  )
}
