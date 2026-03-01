import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getLogs } from '@/services/admin'
import { formatDateTime } from '@/utils/format'
import type { AuditLogEntry } from '@/services/admin'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'login', label: 'Login' },
  { value: 'register', label: 'Register' },
  { value: 'verification', label: 'Verification' },
]

export function AdminLogs() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    getLogs({
      page,
      limit,
      type: typeFilter || undefined,
      userId: userIdFilter || undefined,
    })
      .then((res) => {
        setEntries(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setEntries([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, typeFilter, userIdFilter])

  return (
    <div className="space-y-4">
      <PageTitle title="Audit Logs" icon="Logs" />

      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          />
          <Input
            label="User ID"
            placeholder="Filter by user..."
            value={userIdFilter}
            onChange={(e) => { setUserIdFilter(e.target.value); setPage(1) }}
            className="max-w-xs"
          />
        </div>
        <CardTitle className="mb-2">Logs</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">No logs found.</p>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>Time</TableTh>
                  <TableTh>Type</TableTh>
                  <TableTh>User</TableTh>
                  <TableTh>Details</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableTd className="whitespace-nowrap">{formatDateTime(e.createdAt)}</TableTd>
                    <TableTd>{e.type}</TableTd>
                    <TableTd>{e.userEmail ?? e.userId ?? '—'}</TableTd>
                    <TableTd className="max-w-xs truncate">{e.payload ? JSON.stringify(e.payload) : '—'}</TableTd>
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
