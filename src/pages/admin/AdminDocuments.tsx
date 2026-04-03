import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { PageTitle } from '@/components/ui/PageTitle'
import { Badge } from '@/components/ui/Badge'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import {
  getAdminStudentDocuments,
  reviewDocument,
  type AdminDocumentFilter,
  type PendingDocumentItem,
} from '@/services/admin'
import { getImageUrl } from '@/services/upload'
import { getApiError } from '@/services/auth'
import { toastApiError } from '@/utils/toastError'
import { cn } from '@/utils/cn'
import { Download, Eye, FileText } from 'lucide-react'

const FILTERS: AdminDocumentFilter[] = ['pending', 'all', 'approved', 'rejected']

function statusBadgeVariant(status: string): 'warning' | 'success' | 'error' | 'default' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  if (status === 'pending') return 'warning'
  return 'default'
}

function formatType(type: string | undefined) {
  return type ? type.replace(/_/g, ' ') : '—'
}

export function AdminDocuments() {
  const { t } = useTranslation(['common', 'admin'])
  const [filter, setFilter] = useState<AdminDocumentFilter>('pending')
  const [list, setList] = useState<PendingDocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ item: PendingDocumentItem; decision: 'approved' | 'rejected' } | null>(null)
  const [previewItem, setPreviewItem] = useState<PendingDocumentItem | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getAdminStudentDocuments(filter)
      .then(setList)
      .catch((e) => {
        toastApiError(e)
        setList([])
      })
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

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

  const downloadHref = (item: PendingDocumentItem) => (item.fileUrl ? getImageUrl(item.fileUrl) : '')

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:documentReviewTitle', 'Certificates & documents')} icon="FileText" />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f
                ? 'border-primary-accent bg-primary-accent/15 text-primary-accent'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]/40'
            )}
          >
            {f === 'pending' && t('admin:documentsFilterPending', 'Awaiting review')}
            {f === 'all' && t('admin:documentsFilterAll', 'All')}
            {f === 'approved' && t('admin:documentsFilterApproved', 'Approved')}
            {f === 'rejected' && t('admin:documentsFilterRejected', 'Rejected')}
          </button>
        ))}
      </div>

      <Card>
        <CardTitle>{t('admin:documentReviewSubtitle', 'Review student uploads')}</CardTitle>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {t(
            'admin:documentReviewHint',
            'Only approved documents are visible to universities. Preview or download the file, then approve or reject.'
          )}
        </p>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">
            {filter === 'pending'
              ? t('admin:noDocumentsPending', 'No documents awaiting review.')
              : t('admin:noDocumentsInFilter', 'No documents in this list.')}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)]">
            {list.map((item) => {
              const pending = item.status === 'pending'
              const href = downloadHref(item)
              return (
                <li key={item.id} className="py-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.studentName || t('admin:studentProfile', 'Student')}</p>
                        <Badge variant={statusBadgeVariant(item.status)}>
                          {item.status === 'pending' && t('admin:pending', 'Pending')}
                          {item.status === 'approved' && t('admin:documentStatusApproved', 'Approved')}
                          {item.status === 'rejected' && t('admin:rejected', 'Rejected')}
                          {!['pending', 'approved', 'rejected'].includes(item.status) && item.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm capitalize text-[var(--color-text-muted)]">{formatType(item.type)}</p>
                      {(item.name || item.certificateType || item.score) && (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {[item.name, item.certificateType, item.score].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {item.createdAt && (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {t('admin:submittedAt', 'Submitted')}: {new Date(item.createdAt).toLocaleString()}
                        </p>
                      )}
                      {item.reviewedAt && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {t('admin:reviewedAt', 'Reviewed')}: {new Date(item.reviewedAt).toLocaleString()}
                        </p>
                      )}
                      {item.rejectionReason ? (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {t('admin:rejectionReasonLabel', 'Reason')}: {item.rejectionReason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    <Button type="button" size="sm" variant="secondary" icon={<Eye size={16} />} onClick={() => setPreviewItem(item)}>
                      {t('admin:previewDocument', 'Preview')}
                    </Button>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className={cn(
                          'inline-flex items-center justify-center gap-2 rounded-input px-3 py-1.5 text-sm font-medium',
                          'border-2 border-transparent bg-transparent text-[var(--color-text)] hover:bg-[var(--color-border)]',
                          'focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2'
                        )}
                      >
                        <Download size={16} aria-hidden />
                        {t('admin:downloadDocument', 'Download')}
                      </a>
                    ) : null}
                    {pending ? (
                      <>
                        <Button size="sm" onClick={() => setModal({ item, decision: 'approved' })}>
                          {t('admin:approve')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setModal({ item, decision: 'rejected' })}>
                          {t('admin:reject')}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={!!modal}
        onClose={() => {
          setModal(null)
          setReason('')
          setError('')
        }}
        title={modal?.decision === 'approved' ? t('admin:approveDocument', 'Approve document') : t('admin:rejectDocument', 'Reject document')}
        footer={
          modal ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setModal(null)
                  setReason('')
                }}
              >
                {t('common:cancel')}
              </Button>
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
              {modal.item.studentName} — {formatType(modal.item.type)}
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
        title={previewItem?.name ?? previewItem?.type ?? 'Document'}
        document={
          previewItem
            ? {
                fileUrl: previewItem.fileUrl,
                canvasJson: previewItem.canvasJson,
                pageFormat: previewItem.pageFormat,
                width: previewItem.width,
                height: previewItem.height,
              }
            : null
        }
      />
    </div>
  )
}
