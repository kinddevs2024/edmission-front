import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getOffers, updateOfferStatus, type AdminOffer } from '@/services/admin'
import { formatDateTime } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

const STATUS_OPTIONS = [
  { value: '', labelKey: 'admin:allStatuses' },
  { value: 'pending', labelKey: 'admin:pending' },
  { value: 'accepted', labelKey: 'admin:accepted' },
  { value: 'declined', labelKey: 'admin:declined' },
]

export function AdminOffers() {
  const { t } = useTranslation(['admin', 'common'])
  const [items, setItems] = useState<AdminOffer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const limit = 20
  const statusOptions = STATUS_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))

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
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label={t('common:status', 'Status')}
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
        </div>
        <CardTitle>{t('admin:allOffers')}</CardTitle>
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>ID</TableTh>
                  <TableTh>{t('admin:studentProfile', 'Student profile')}</TableTh>
                  <TableTh>{t('admin:universityProfile', 'University profile')}</TableTh>
                  <TableTh>{t('admin:coveragePercent', 'Coverage %')}</TableTh>
                  <TableTh>{t('common:status', 'Status')}</TableTh>
                  <TableTh>{t('admin:createdLabel', 'Created')}</TableTh>
                  <TableTh>{t('common:actions', 'Actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((o) => (
                  <TableRow key={o.id}>
                    <TableTd className="font-mono text-xs">{o.id}</TableTd>
                    <TableTd className="font-mono text-xs">{String(o.studentId)}</TableTd>
                    <TableTd className="font-mono text-xs">{String(o.universityId)}</TableTd>
                    <TableTd>{o.coveragePercent}</TableTd>
                    <TableTd>{o.status}</TableTd>
                    <TableTd>{o.createdAt ? formatDateTime(o.createdAt) : '—'}</TableTd>
                    <TableTd>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" disabled={!!actionId} loading={actionId === o.id} onClick={() => changeStatus(o.id, 'accepted')}>
                          {t('admin:accept', 'Accept')}
                        </Button>
                        <Button size="sm" variant="danger" disabled={!!actionId} loading={actionId === o.id} onClick={() => changeStatus(o.id, 'declined')}>
                          {t('admin:decline', 'Decline')}
                        </Button>
                      </div>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}

