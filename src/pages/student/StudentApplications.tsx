import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getApplications } from '@/services/student'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/utils/constants'
import { MessageCircle, Gift } from 'lucide-react'
import { formatDate } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'
import type { Application, ApplicationStatus } from '@/types/student'

export function StudentApplications() {
  const { t } = useTranslation(['student', 'common'])
  const STATUS_OPTIONS = [
    { value: '', label: t('student:allStatuses') },
    ...(Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))),
  ]
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
      .catch((e) => {
        toastApiError(e)
        setApplications([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  return (
    <div className="space-y-4">
      <PageTitle title={t('student:navApplications')} icon="FileCheck" />

      <Card className="animate-card-enter">
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label={t('common:status')}
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
        </div>
        <CardTitle className="mb-2">{t('common:applications')}</CardTitle>
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('student:noApplications')}
            description={t('student:noApplicationsDesc')}
            actionLabel={t('student:exploreUniversities')}
            actionTo="/student/universities"
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('common:university')}</TableTh>
                  <TableTh>{t('common:status')}</TableTh>
                  <TableTh>{t('common:date')}</TableTh>
                  <TableTh>{t('common:updated')}</TableTh>
                  <TableTh>{t('common:actions')}</TableTh>
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
                        <Button to={`/student/chat?universityId=${encodeURIComponent(a.universityId)}`} variant="ghost" size="sm" icon={<MessageCircle size={16} />}>{t('student:navChat')}</Button>
                      )}
                      <Button to="/student/offers" variant="ghost" size="sm" icon={<Gift size={16} />}>{t('student:navOffers')}</Button>
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
