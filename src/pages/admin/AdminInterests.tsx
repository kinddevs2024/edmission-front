import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getInterests, openInterestChat, type AdminInterest } from '@/services/admin'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

export function AdminInterests() {
  const { t } = useTranslation(['admin', 'common'])
  const navigate = useNavigate()
  const { role } = useAuth()
  const canOpenChat = role === 'admin'
  const [items, setItems] = useState<AdminInterest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const limit = 20
  const statusOptions = [
    { value: '', label: t('admin:allStatuses', 'All statuses') },
    { value: 'interested', label: t('admin:interestedStatus', 'Interested') },
    { value: 'under_review', label: t('admin:underReview', 'Under review') },
    { value: 'chat_opened', label: t('admin:chatOpened', 'Chat opened') },
    { value: 'offer_sent', label: t('admin:offerSent', 'Offer sent') },
    { value: 'rejected', label: t('admin:rejected', 'Rejected') },
    { value: 'accepted', label: t('admin:accepted', 'Accepted') },
  ]

  useEffect(() => {
    setLoading(true)
    getInterests({ page, limit, status: statusFilter || undefined })
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

  const handleOpenChat = (item: AdminInterest) => {
    if (!canOpenChat) return
    const source = (item as { source?: string }).source
    if (source === 'catalog') {
      toastApiError(new Error('Catalog university interests cannot be opened in chat'))
      return
    }
    setActionId(item.id)
    openInterestChat(item.id)
      .then((res) => {
        const chatId = String(res.chatId ?? '').trim()
        if (!chatId) throw new Error('Chat id is missing')
        navigate(`/admin/chats?chatId=${encodeURIComponent(chatId)}`)
      })
      .catch(toastApiError)
      .finally(() => setActionId(null))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:interests')} icon="Heart" />

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <CardTitle>{t('admin:allInterests', 'All interests')}</CardTitle>
          <div className="w-full md:w-56">
            <Select
              label={t('common:status', 'Status')}
              options={statusOptions}
              value={statusFilter}
              className="min-h-10 py-2"
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('admin:studentLabel', 'Student')}</TableTh>
                  <TableTh>{t('common:university', 'University')}</TableTh>
                  <TableTh>{t('admin:sourceLabel', 'Source')}</TableTh>
                  <TableTh>{t('common:status', 'Status')}</TableTh>
                  <TableTh>{t('admin:chatCreated', 'Chat created')}</TableTh>
                  <TableTh>{t('admin:interestCreated', 'Interest created')}</TableTh>
                  <TableTh>{t('common:actions', 'Actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((x) => (
                  <TableRow key={x.id}>
                    <TableTd>{x.studentName?.trim() || String(x.studentId || '-')}</TableTd>
                    <TableTd>{x.universityName?.trim() || String(x.universityId || '-')}</TableTd>
                    <TableTd>{(x as { source?: string }).source === 'catalog' ? t('admin:catalogUniversity', 'Catalog') : t('admin:verifiedUniversity', 'Verified')}</TableTd>
                    <TableTd>{t(`admin:${x.status}`, x.status)}</TableTd>
                    <TableTd>{x.chatCreatedAt ? formatDateTime(x.chatCreatedAt) : '-'}</TableTd>
                    <TableTd>{x.createdAt ? formatDateTime(x.createdAt) : '-'}</TableTd>
                    <TableTd>
                      {canOpenChat ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!!actionId || (x as { source?: string }).source === 'catalog'}
                          loading={actionId === x.id}
                          onClick={() => handleOpenChat(x)}
                        >
                          {(x as { source?: string }).source === 'catalog'
                            ? t('admin:chatUnavailable', 'Chat unavailable')
                            : t('admin:openChat', 'Open chat')}
                        </Button>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">{t('common:viewOnly', 'View only')}</span>
                      )}
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


