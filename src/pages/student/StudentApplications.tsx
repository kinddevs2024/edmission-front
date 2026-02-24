import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getApplications } from '@/services/student'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import type { Application, ApplicationStatus } from '@/types/student'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...(Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))),
]

export function StudentApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 10

  useEffect(() => {
    setLoading(true)
    getApplications({
      page,
      limit,
      status: statusFilter || undefined,
    })
      .then((res) => {
        setApplications(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setApplications([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  return (
    <div className="space-y-4">
      <h1 className="text-h1">My Applications</h1>

      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
        </div>
        <CardTitle className="mb-2">Applications</CardTitle>
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Explore universities and show interest to start applying."
            actionLabel="Explore universities"
            actionTo="/student/universities"
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>University</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Date</TableTh>
                  <TableTh>Updated</TableTh>
                  <TableTh>Actions</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((a) => (
                  <TableRow key={a.id}>
                    <TableTd>{a.universityName ?? a.universityId}</TableTd>
                    <TableTd>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${APPLICATION_STATUS_COLORS[a.status as ApplicationStatus]}`}>
                        {APPLICATION_STATUS_LABELS[a.status as ApplicationStatus]}
                      </span>
                    </TableTd>
                    <TableTd>{formatDate(a.createdAt)}</TableTd>
                    <TableTd>{formatDate(a.updatedAt)}</TableTd>
                    <TableTd>
                      {['chat_opened', 'offer_sent', 'under_review'].includes(a.status) && (
                        <Button to="/student/chat" variant="ghost" size="sm">Chat</Button>
                      )}
                      <Button to="/student/offers" variant="ghost" size="sm">Offers</Button>
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
