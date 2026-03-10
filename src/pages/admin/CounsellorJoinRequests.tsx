import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { listJoinRequests, acceptJoinRequest, rejectJoinRequest, type JoinRequestItem } from '@/services/counsellor'
import { toastApiError } from '@/utils/toastError'

export function CounsellorJoinRequests() {
  const { t } = useTranslation(['common', 'admin'])
  const [list, setList] = useState<JoinRequestItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const limit = 20

  const load = () => {
    setLoading(true)
    listJoinRequests({ page, limit, status: statusFilter || undefined })
      .then((res) => {
        setList(res.data)
        setTotal(res.total)
      })
      .catch((e) => {
        toastApiError(e)
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, statusFilter])

  const handleAccept = (id: string) => {
    setActionId(id)
    acceptJoinRequest(id)
      .then(() => load())
      .catch(toastApiError)
      .finally(() => setActionId(null))
  }

  const handleReject = (id: string) => {
    setActionId(id)
    rejectJoinRequest(id)
      .then(() => load())
      .catch(toastApiError)
      .finally(() => setActionId(null))
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:joinRequests', 'Join requests')} icon="Users" />

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-input border bg-[var(--color-card)] px-3 py-2 text-sm"
          >
            <option value="">{t('admin:allStatuses')}</option>
            <option value="pending">{t('admin:pending', 'Pending')}</option>
            <option value="accepted">{t('admin:accepted', 'Accepted')}</option>
            <option value="rejected">{t('admin:rejected', 'Rejected')}</option>
          </select>
        </div>
        <CardTitle>{t('admin:requestsList', 'Requests')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">{t('admin:noJoinRequests', 'No requests.')}</p>
        ) : (
          <>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 font-medium">Email</th>
                    <th className="text-left py-2 font-medium">{t('common:name')}</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-right py-2 font-medium">{t('common:actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3">{r.studentEmail}</td>
                      <td className="py-3">{r.studentName}</td>
                      <td className="py-3">{r.status}</td>
                      <td className="py-3 text-right">
                        {r.status === 'pending' && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleAccept(r.id)} disabled={!!actionId} loading={actionId === r.id}>{t('admin:accept', 'Accept')}</Button>
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleReject(r.id)} disabled={!!actionId} loading={actionId === r.id}>{t('admin:reject', 'Reject')}</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common:prev')}</Button>
                <span className="flex items-center px-2 text-[var(--color-text-muted)]">{page} / {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('common:next')}</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
