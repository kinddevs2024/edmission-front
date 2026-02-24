import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { getScholarshipsSummary } from '@/services/admin'
import { formatDate } from '@/utils/format'

export function AdminScholarships() {
  const [list, setList] = useState<Awaited<ReturnType<typeof getScholarshipsSummary>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getScholarshipsSummary()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-h1">Scholarship Monitoring</h1>

      <Card>
        <CardTitle>Summary by university</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">Loading...</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">No data.</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>University</TableTh>
                <TableTh>Used / Total slots</TableTh>
                <TableTh>Deadline</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.universityId}>
                  <TableTd>{row.universityName}</TableTd>
                  <TableTd>{row.usedSlots} / {row.totalSlots}</TableTd>
                  <TableTd>{row.deadline ? formatDate(row.deadline) : '—'}</TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
