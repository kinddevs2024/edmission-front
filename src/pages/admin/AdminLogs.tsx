import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getLogs } from '@/services/admin'
import { formatDateTime } from '@/utils/format'
import type { AuditLogEntry } from '@/services/admin'
import { toastApiError } from '@/utils/toastError'

export function AdminLogs() {
  const { t } = useTranslation(['admin', 'common'])
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20
  const typeOptions = [
    { value: '', label: t('admin:allTypes', 'All types') },
    { value: 'login', label: t('admin:login', 'Login') },
    { value: 'register', label: t('admin:register', 'Register') },
    { value: 'verification', label: t('admin:verification', 'Verification') },
  ]

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
      .catch((e) => {
        toastApiError(e)
        setEntries([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, typeFilter, userIdFilter])

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:auditLogs', 'Audit logs')} icon="Logs" />

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle>{t('admin:logs', 'Logs')}</CardTitle>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-[180px_220px]">
            <Select
              label={t('admin:typeLabel', 'Type')}
              options={typeOptions}
              value={typeFilter}
              className="min-h-10 py-2"
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            />
            <Input
              label={t('admin:userId', 'User ID')}
              placeholder={t('admin:filterByUser', 'Filter by user...')}
              value={userIdFilter}
              className="min-h-10 py-2"
              onChange={(e) => { setUserIdFilter(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : entries.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">{t('admin:noLogsFound', 'No logs found.')}</p>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('common:time', 'Time')}</TableTh>
                  <TableTh>{t('admin:typeLabel', 'Type')}</TableTh>
                  <TableTh>{t('admin:userLabel', 'User')}</TableTh>
                  <TableTh>{t('common:details', 'Details')}</TableTh>
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
