import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { PageTitle } from '@/components/ui/PageTitle'
import { getVerificationQueue, approveUniversity, rejectUniversity } from '@/services/admin'
import { formatDate } from '@/utils/format'
import type { VerificationItem } from '@/services/admin'
import { toastApiError } from '@/utils/toastError'

export function Verification() {
  const { t } = useTranslation(['common', 'admin'])
  const [list, setList] = useState<VerificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; item: VerificationItem } | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getVerificationQueue()
      .then(setList)
      .catch((e) => { toastApiError(e); setList([]) })
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
      .catch(toastApiError)
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
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:universityVerification', 'University verification')} icon="ShieldCheck" />

      <Card>
        <CardTitle>{t('admin:queue', 'Queue')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">{t('admin:noUniversitiesPendingVerification', 'No universities pending verification.')}</p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {list.map((item, index) => (
              <div
                key={item.id}
                className="animate-card-enter opacity-0"
                style={{ animationDelay: `${Math.min(index, 6) * 0.06}s`, animationFillMode: 'forwards' }}
              >
                <Card className="p-4" interactive>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{item.email}</p>
                    {item.country && <p className="text-sm text-[var(--color-text-muted)]">{item.country}</p>}
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {t('admin:submittedLabel', 'Submitted')}: {formatDate(item.submittedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => setActionModal({ type: 'approve', item })}>{t('admin:approve')}</Button>
                    <Button size="sm" variant="danger" onClick={() => setActionModal({ type: 'reject', item })}>{t('admin:reject')}</Button>
                  </div>
                </div>
                {item.documents && item.documents.length > 0 && (
                  <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{t('admin:documents', 'Documents')}</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {item.documents.map((d, i) => (
                        <li key={i}>
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline">{d.name}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={!!actionModal}
        onClose={() => { setActionModal(null); setComment('') }}
        title={actionModal?.type === 'approve' ? t('admin:approveUniversity') : t('admin:rejectUniversity')}
        footer={
          actionModal ? (
            <>
              <Button variant="secondary" onClick={() => { setActionModal(null); setComment('') }}>{t('common:cancel')}</Button>
              {actionModal.type === 'approve' ? (
                <Button onClick={handleApprove} disabled={submitting} loading={submitting}>{t('admin:approve')}</Button>
              ) : (
                <Button variant="danger" onClick={handleReject} disabled={submitting} loading={submitting}>{t('admin:reject')}</Button>
              )}
            </>
          ) : undefined
        }
      >
        {actionModal && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">{actionModal.item.name}</p>
            <Textarea
              label={t('admin:commentOptional', 'Comment (optional)')}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('admin:addComment')}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
