import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getInterests, updateInterestStatus, type AdminInterest } from '@/services/admin'
import { formatDateTime } from '@/utils/format'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'interested', label: 'Interested' },
  { value: 'under_review', label: 'Under review' },
  { value: 'chat_opened', label: 'Chat opened' },
  { value: 'offer_sent', label: 'Offer sent' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
]

export function AdminInterests() {
  const [items, setItems] = useState<AdminInterest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    getInterests({ page, limit, status: statusFilter || undefined })
      .then((res) => {
        setItems(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  const setStatus = (id: string, status: string) => {
    setActionId(id)
    updateInterestStatus(id, status)
      .then(() => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x))))
      .catch(() => {})
      .finally(() => setActionId(null))
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Interests" icon="Heart" />

      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
        </div>
        <CardTitle>All interests</CardTitle>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>ID</TableTh>
                  <TableTh>StudentProfile</TableTh>
                  <TableTh>UniversityProfile</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Created</TableTh>
                  <TableTh>Actions</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((x) => (
                  <TableRow key={x.id}>
                    <TableTd className="font-mono text-xs">{x.id}</TableTd>
                    <TableTd className="font-mono text-xs">{String(x.studentId)}</TableTd>
                    <TableTd className="font-mono text-xs">{String(x.universityId)}</TableTd>
                    <TableTd>{x.status}</TableTd>
                    <TableTd>{x.createdAt ? formatDateTime(x.createdAt) : '—'}</TableTd>
                    <TableTd>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" disabled={!!actionId} loading={actionId === x.id} onClick={() => setStatus(x.id, 'under_review')}>
                          Under review
                        </Button>
                        <Button size="sm" variant="secondary" disabled={!!actionId} loading={actionId === x.id} onClick={() => setStatus(x.id, 'chat_opened')}>
                          Chat opened
                        </Button>
                        <Button size="sm" variant="danger" disabled={!!actionId} loading={actionId === x.id} onClick={() => setStatus(x.id, 'rejected')}>
                          Reject
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

