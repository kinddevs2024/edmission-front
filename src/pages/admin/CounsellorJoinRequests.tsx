import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { Select } from '@/components/ui/Select'
import axios from 'axios'
import { listJoinRequests, acceptJoinRequest, rejectJoinRequest, type JoinRequestItem } from '@/services/counsellor'
import { toastApiError } from '@/utils/toastError'
import { toast } from 'sonner'

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
      .then(() => {
        toast.success(t('admin:requestAccepted', 'Request accepted'))
        load()
      })
      .catch((e) => {
        const res = axios.isAxiosError(e) ? e.response?.data : null
        if (res?.code === 'VALIDATION' && String(res?.message ?? '').toLowerCase().includes('already processed')) {
          toast.info(t('admin:requestAlreadyProcessed', 'Already processed'))
          load()
        } else {
          toastApiError(e)
        }
      })
      .finally(() => setActionId(null))
  }

  const handleReject = (id: string) => {
    setActionId(id)
    rejectJoinRequest(id)
      .then(() => {
        toast.success(t('admin:requestRejected', 'Request rejected'))
        load()
      })
      .catch((e) => {
        const res = axios.isAxiosError(e) ? e.response?.data : null
        if (res?.code === 'VALIDATION' && String(res?.message ?? '').toLowerCase().includes('already processed')) {
          toast.info(t('admin:requestAlreadyProcessed', 'Already processed'))
          load()
        } else {
          toastApiError(e)
        }
      })
      .finally(() => setActionId(null))
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:joinRequests', 'Join requests')} icon="Users" />

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            placeholder={t('admin:allStatuses')}
            options={[
              { value: '', label: t('admin:allStatuses') },
              { value: 'pending', label: t('admin:pending', 'Pending') },
              { value: 'accepted', label: t('admin:accepted', 'Accepted') },
              { value: 'rejected', label: t('admin:rejected', 'Rejected') },
            ]}
            className="min-w-[140px]"
          />
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
                      <td className="py-2">{r.studentEmail}</td>
                      <td className="py-2">{r.studentName}</td>
                      <td className="py-2">{r.status}</td>
                      <td className="py-2 text-right">
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
