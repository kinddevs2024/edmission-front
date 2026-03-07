import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import {
  getUniversityVerificationRequests,
  approveUniversityRequest,
  rejectUniversityRequest,
  type UniversityVerificationRequestItem,
} from '@/services/admin'
import { formatDate } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

export function AdminUniversityRequests() {
  const { t } = useTranslation(['common', 'admin'])
  const [list, setList] = useState<UniversityVerificationRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; item: UniversityVerificationRequestItem } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getUniversityVerificationRequests(filter === 'pending' ? { status: 'pending' } : undefined)
      .then(setList)
      .catch((e) => { toastApiError(e); setList([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [filter])

  const handleApprove = () => {
    if (!actionModal) return
    setSubmitting(true)
    approveUniversityRequest(actionModal.item.id)
      .then(() => {
        setActionModal(null)
        load()
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  const handleReject = () => {
    if (!actionModal) return
    setSubmitting(true)
    rejectUniversityRequest(actionModal.item.id)
      .then(() => {
        setActionModal(null)
        load()
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:universityRequests', 'University requests')} icon="Users" />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <CardTitle>{t('admin:verificationRequests', 'Verification requests')}</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'pending' ? 'primary' : 'secondary'}
              onClick={() => setFilter('pending')}
            >
              {t('admin:pending', 'Pending')}
            </Button>
            <Button
              size="sm"
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              {t('admin:all', 'All')}
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">
            {filter === 'pending'
              ? t('admin:noPendingRequests', 'No pending requests.')
              : t('admin:noRequests', 'No requests.')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 font-medium">{t('admin:university', 'University')}</th>
                  <th className="text-left py-2 font-medium">{t('admin:email', 'Email')}</th>
                  <th className="text-left py-2 font-medium">{t('common:date', 'Date')}</th>
                  <th className="text-left py-2 font-medium">{t('admin:status', 'Status')}</th>
                  {filter === 'all' && <th className="text-left py-2 font-medium">{t('admin:reviewedAt', 'Reviewed')}</th>}
                  <th className="text-right py-2 font-medium">{t('common:actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-3">
                      <span className="font-medium">{item.university?.name ?? '—'}</span>
                      {(item.university?.country || item.university?.city) && (
                        <span className="block text-[var(--color-text-muted)] text-xs">
                          {[item.university.city, item.university.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3">{item.userEmail ?? '—'}</td>
                    <td className="py-3">{formatDate(item.createdAt)}</td>
                    <td className="py-3">
                      <span
                        className={
                          item.status === 'approved'
                            ? 'text-green-600'
                            : item.status === 'rejected'
                              ? 'text-red-600'
                              : 'text-amber-600'
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    {filter === 'all' && (
                      <td className="py-3">{item.reviewedAt ? formatDate(item.reviewedAt) : '—'}</td>
                    )}
                    <td className="py-3 text-right">
                      {item.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => setActionModal({ type: 'approve', item })}>
                            {t('admin:approve')}
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setActionModal({ type: 'reject', item })}>
                            {t('admin:reject')}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.type === 'approve' ? t('admin:approveUniversity') : t('admin:rejectUniversity')}
        footer={
          actionModal ? (
            <>
              <Button variant="secondary" onClick={() => setActionModal(null)}>
                {t('common:cancel')}
              </Button>
              {actionModal.type === 'approve' ? (
                <Button onClick={handleApprove} disabled={submitting} loading={submitting}>
                  {t('admin:approve')}
                </Button>
              ) : (
                <Button variant="danger" onClick={handleReject} disabled={submitting} loading={submitting}>
                  {t('admin:reject')}
                </Button>
              )}
            </>
          ) : null
        }
      >
        {actionModal && (
          <p className="text-[var(--color-text-muted)]">
            {actionModal.type === 'approve'
              ? t('admin:approveRequestConfirm', 'Create university profile from catalog and notify the user?')
              : t('admin:rejectRequestConfirm', 'Reject this verification request?')}
            <br />
            <strong>{actionModal.item.university?.name}</strong> — {actionModal.item.userEmail}
          </p>
        )}
      </Modal>
    </div>
  )
}
