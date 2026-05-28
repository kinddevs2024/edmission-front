import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getOffers, updateOfferStatus, type AdminOffer } from '@/services/admin'
import { getMyDocuments } from '@/services/studentDocuments'
import DocumentListModal from '@/components/ui/DocumentListModal'
import { formatDateTime } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

export function AdminOffers() {
  const { t } = useTranslation(['admin', 'common'])
  const [items, setItems] = useState<AdminOffer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const limit = 20
  const statusOptions = [
    { value: '', label: t('admin:allStatuses', 'All statuses') },
    { value: 'pending', label: t('admin:pending', 'Pending') },
    { value: 'accepted', label: t('admin:accepted', 'Accepted') },
    { value: 'declined', label: t('admin:declined', 'Declined') },
  ]

  const [documentsModal, setDocumentsModal] = useState<{ open: boolean; studentId: string }>({ open: false, studentId: '' });
  useEffect(() => {
    setLoading(true)
    getOffers({ page, limit, status: statusFilter || undefined })
      .then((res) => {
        setItems(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((e) => {
        toastApiError(e)
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  const changeStatus = (id: string, status: 'pending' | 'accepted' | 'declined') => {
    setActionId(id)
    updateOfferStatus(id, status)
      .then(() => setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o))))
      .catch(toastApiError)
      .finally(() => setActionId(null))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:offersTitle', 'Offers')} icon="Gift" />

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <CardTitle>{t('admin:allOffers', 'All offers')}</CardTitle>
          <div className="w-full md:w-52">
            <Select
              label={t('common:status', 'Status')}
              options={statusOptions}
              value={statusFilter}
              className="min-h-10 py-2"
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('common:id', 'ID')}</TableTh>
                  <TableTh>{t('admin:studentProfile', 'Student profile')}</TableTh>
                  <TableTh>{t('admin:universityProfile', 'University profile')}</TableTh>
                  <TableTh>{t('admin:coveragePercent', 'Coverage %')}</TableTh>
                  <TableTh>{t('common:status', 'Status')}</TableTh>
                  <TableTh>{t('admin:createdLabel', 'Created')}</TableTh>
                <TableTh>{t('admin:documents', 'Documents')}</TableTh>
                  <TableTh>{t('common:actions', 'Actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((o) => (
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((o) => (
                  <TableRow key={o.id}>
                    <TableTd className="font-mono text-xs">{o.id}</TableTd>
                    <TableTd className="font-mono text-xs">{String(o.studentId)}</TableTd>
                    <TableTd className="font-mono text-xs">{String(o.universityId)}</TableTd>
                    <TableTd>{o.coveragePercent}</TableTd>
                    <TableTd>{t(`admin:${o.status}`, o.status)}</TableTd>
                    <TableTd>{o.createdAt ? formatDateTime(o.createdAt) : '—'}</TableTd>
                    <TableTd>
                      <Button size="sm" variant="secondary" disabled={!!actionId} loading={actionId === o.id} onClick={() => setDocumentsModal({ open: true, studentId: o.studentId })}>Documents</Button>
                    </TableTd>
                    <TableTd>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" disabled={!!actionId} loading={actionId === o.id} onClick={() => changeStatus(o.id, 'accepted')}>
                          {t('admin:accept', 'Accept')}
                        </Button>
                        <Button size="sm" variant="danger" disabled={!!actionId} loading={actionId === o.id} onClick={() => changeStatus(o.id, 'declined')}>
                          {t('admin:decline', 'Decline')}
                      </div>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        <DocumentListModal isOpen={documentsModal.open} onClose={() => setDocumentsModal({ open: false, studentId: '' })} studentId={documentsModal.studentId} />
          </>
        )}
      </Card>
    </div>
  )
}

