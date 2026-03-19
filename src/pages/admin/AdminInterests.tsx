import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getInterests, updateInterestStatus, type AdminInterest } from '@/services/admin'
import { formatDateTime } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

const STATUS_OPTIONS = [
  { value: '', labelKey: 'admin:allStatuses' },
  { value: 'interested', labelKey: 'admin:interestedStatus' },
  { value: 'under_review', labelKey: 'admin:underReview' },
  { value: 'chat_opened', labelKey: 'admin:chatOpened' },
  { value: 'offer_sent', labelKey: 'admin:offerSent' },
  { value: 'rejected', labelKey: 'admin:rejected' },
  { value: 'accepted', labelKey: 'admin:accepted' },
]

export function AdminInterests() {
  const { t } = useTranslation(['admin', 'common'])
  const [items, setItems] = useState<AdminInterest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const limit = 20
  const statusOptions = STATUS_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))

  useEffect(() => {
    setLoading(true)
    getInterests({ page, limit, status: statusFilter || undefined })
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

  const setStatus = (id: string, status: string) => {
    setActionId(id)
    updateInterestStatus(id, status)
      .then(() => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x))))
      .catch(toastApiError)
      .finally(() => setActionId(null))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:interests')} icon="Heart" />

      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label={t('common:status', 'Status')}
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
        </div>
        <CardTitle>{t('admin:allInterests')}</CardTitle>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('admin:studentLabel', 'Student')}</TableTh>
                  <TableTh>{t('admin:universityLabel', 'University')}</TableTh>
                  <TableTh>{t('admin:sourceLabel', 'Source')}</TableTh>
                  <TableTh>{t('common:status', 'Status')}</TableTh>
                  <TableTh>{t('admin:createdLabel', 'Created')}</TableTh>
                  <TableTh>{t('common:actions', 'Actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((x) => (
                  <TableRow key={x.id}>
                    <TableTd className="font-mono text-xs">{String(x.studentId)}</TableTd>
                    <TableTd className="font-mono text-xs">{String(x.universityId)}</TableTd>
                    <TableTd>{(x as { source?: string }).source === 'catalog' ? t('admin:catalogUniversity', 'Catalog') : t('admin:verifiedUniversity', 'Verified')}</TableTd>
                    <TableTd>{x.status}</TableTd>
                    <TableTd>{x.createdAt ? formatDateTime(x.createdAt) : '—'}</TableTd>
                    <TableTd>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" disabled={!!actionId} loading={actionId === x.id} onClick={() => setStatus(x.id, 'under_review')}>
                          {t('admin:underReview')}
                        </Button>
                        <Button size="sm" variant="secondary" disabled={!!actionId} loading={actionId === x.id} onClick={() => setStatus(x.id, 'chat_opened')}>
                          {t('admin:chatOpened')}
                        </Button>
                        <Button size="sm" variant="danger" disabled={!!actionId} loading={actionId === x.id} onClick={() => setStatus(x.id, 'rejected')}>
                          {t('admin:reject')}
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

