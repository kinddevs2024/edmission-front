import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getChats, getChatMessages, type AdminChat, type AdminChatMessage } from '@/services/admin'
import { formatDateTime } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

export function AdminChats() {
  const { t } = useTranslation(['common', 'admin'])
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<AdminChat[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalChatId, setModalChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AdminChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const limit = 20

  const chatIdFromUrl = searchParams.get('chatId')

  useEffect(() => {
    setLoading(true)
    getChats({ page, limit })
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
  }, [page])

  useEffect(() => {
    if (chatIdFromUrl) {
      setModalChatId(chatIdFromUrl)
      setMessages([])
      setMessagesLoading(true)
      getChatMessages(chatIdFromUrl, { limit: 100 })
        .then((res) => setMessages(res.messages ?? []))
        .catch((e) => { toastApiError(e); setMessages([]) })
        .finally(() => setMessagesLoading(false))
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev)
        p.delete('chatId')
        return p
      }, { replace: true })
    }
  }, [chatIdFromUrl])

  const openMessages = (chatId: string) => {
    setModalChatId(chatId)
    setMessages([])
    setMessagesLoading(true)
    getChatMessages(chatId, { limit: 100 })
      .then((res) => setMessages(res.messages ?? []))
      .catch((e) => { toastApiError(e); setMessages([]) })
      .finally(() => setMessagesLoading(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:chats')} icon="MessageCircle" />

      <Card>
        <CardTitle>{t('admin:allChats', 'All chats')}</CardTitle>
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>ID</TableTh>
                  <TableTh>{t('admin:studentProfile', 'Student')}</TableTh>
                  <TableTh>{t('admin:universityProfile', 'University')}</TableTh>
                  <TableTh>{t('common:updated', 'Updated')}</TableTh>
                  <TableTh>{t('common:actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableTd className="font-mono text-xs">{c.id}</TableTd>
                    <TableTd className="font-mono text-xs">{String(c.studentId)}</TableTd>
                    <TableTd className="font-mono text-xs">{String(c.universityId)}</TableTd>
                    <TableTd>{c.updatedAt ? formatDateTime(c.updatedAt) : '—'}</TableTd>
                    <TableTd>
                      <Button size="sm" variant="secondary" onClick={() => openMessages(c.id)}>
                        {t('admin:viewMessages', 'View messages')}
                      </Button>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={!!modalChatId}
        onClose={() => setModalChatId(null)}
        title={modalChatId ? t('admin:chatMessagesWithId', 'Chat messages ({{id}})', { id: modalChatId }) : t('admin:chatMessages', 'Chat messages')}
        footer={
          <Button variant="secondary" onClick={() => setModalChatId(null)}>
            {t('common:close')}
          </Button>
        }
      >
        {messagesLoading ? (
          <p className="text-[var(--color-text-muted)]">{t('common:loading')}</p>
        ) : messages.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">{t('admin:noMessages', 'No messages.')}</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className="rounded-input border border-[var(--color-border)] p-3">
                <div className="flex justify-between gap-2 text-xs text-[var(--color-text-muted)]">
                  <span className="font-mono">{m.senderId}</span>
                  <span>{formatDateTime(m.createdAt)}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  )
}

