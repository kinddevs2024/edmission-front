import { useEffect, useState } from 'react'
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
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
]

export function AdminOffers() {
  const [items, setItems] = useState<AdminOffer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const limit = 20

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
      <PageTitle title="Offers" icon="Gift" />

      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
        </div>
        <CardTitle>All offers</CardTitle>
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>ID</TableTh>
                  <TableTh>StudentProfile</TableTh>
                  <TableTh>UniversityProfile</TableTh>
                  <TableTh>Coverage %</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Created</TableTh>
                  <TableTh>Actions</TableTh>
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
                          Accept
                        </Button>
                        <Button size="sm" variant="danger" disabled={!!actionId} loading={actionId === o.id} onClick={() => changeStatus(o.id, 'declined')}>
                          Decline
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

