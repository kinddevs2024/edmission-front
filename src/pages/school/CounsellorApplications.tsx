import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { Select } from '@/components/ui/Select'
import { Table, TableBody, TableHead, TableRow, TableTd, TableTh, Pagination } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { listMyApplications, listMyStudents, type CounsellorApplication, type CounsellorStudent } from '@/services/counsellor'
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'
import { HeartHandshake } from 'lucide-react'
import type { ApplicationStatus } from '@/types/student'

function formatMaybeDate(value?: string) {
  return value ? formatDate(value) : '-'
}

export function CounsellorApplications() {
  const { t } = useTranslation(['common', 'student', 'school', 'admin'])
  const [items, setItems] = useState<CounsellorApplication[]>([])
  const [students, setStudents] = useState<CounsellorStudent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [studentUserId, setStudentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    listMyStudents({ page: 1, limit: 100 })
      .then((res) => setStudents(res.data ?? []))
      .catch(() => setStudents([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    listMyApplications({
      page,
      limit,
      status: status || undefined,
      studentUserId: studentUserId || undefined,
    })
      .then((res) => {
        setItems(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((error) => {
        toastApiError(error)
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, status, studentUserId])

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('student:allStatuses', 'All statuses') },
      ...Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    ],
    [t]
  )

  const studentOptions = useMemo(
    () => [
      { value: '', label: t('school:allStudents', 'All students') },
      ...students.map((student) => ({
        value: student.userId,
        label: student.name || [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email,
      })),
    ],
    [students, t]
  )

  return (
    <div className="space-y-4">
      <PageTitle title={t('school:applications', 'Applications')} icon="Heart" />

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          <Select
            label={t('common:status', 'Status')}
            options={statusOptions}
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1) }}
          />
          <Select
            label={t('school:student', 'Student')}
            options={studentOptions}
            value={studentUserId}
            onChange={(event) => { setStudentUserId(event.target.value); setPage(1) }}
          />
        </div>

        <CardTitle className="mb-2">{t('school:studentApplications', 'Student applications')}</CardTitle>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<HeartHandshake className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('school:noApplicationsYet', 'No applications yet')}
            description={t('school:noApplicationsYetHint', 'When you send interests for students, they will appear here.')}
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('school:student', 'Student')}</TableTh>
                  <TableTh>{t('common:university', 'University')}</TableTh>
                  <TableTh>{t('common:status', 'Status')}</TableTh>
                  <TableTh>{t('admin:source', 'Source')}</TableTh>
                  <TableTh>{t('common:date', 'Date')}</TableTh>
                  <TableTh>{t('common:updated', 'Updated')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const statusKey = item.status as ApplicationStatus
                  return (
                    <TableRow key={item.id}>
                      <TableTd>
                        <div className="font-medium">{item.studentName || '-'}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{item.studentEmail}</div>
                      </TableTd>
                      <TableTd>{item.universityName || item.universityId || '-'}</TableTd>
                      <TableTd>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${APPLICATION_STATUS_COLORS[statusKey] ?? 'bg-slate-500/20 text-slate-500'}`}>
                          {APPLICATION_STATUS_LABELS[statusKey] ?? item.status}
                        </span>
                      </TableTd>
                      <TableTd>{item.source === 'catalog' ? t('admin:catalogUniversity', 'Catalog') : t('admin:verifiedUniversity', 'Verified')}</TableTd>
                      <TableTd>{formatMaybeDate(item.createdAt)}</TableTd>
                      <TableTd>{formatMaybeDate(item.updatedAt)}</TableTd>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}
