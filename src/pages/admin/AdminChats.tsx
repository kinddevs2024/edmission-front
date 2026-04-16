import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { getChats, getChatMessages, sendAdminChatMessage, type AdminChat, type AdminChatMessage } from '@/services/admin'
import { useAuth } from '@/hooks/useAuth'
import { AdminUniversityOfferModal } from '@/components/admin/AdminUniversityOfferModal'
import { formatDateTime } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

export function AdminChats() {
  const { t } = useTranslation(['common', 'admin'])
  const { role } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<AdminChat[]>([])
  const [total, setTotal] = useState(0)
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([])
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalChatId, setModalChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AdminChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [offerContext, setOfferContext] = useState<{
    universityUserId: string
    studentProfileId?: string
    chatId?: string
    studentLabel?: string
  } | null>(null)
  const limit = 20

  const chatIdFromUrl = searchParams.get('chatId')

  const openMessages = useCallback((chatId: string) => {
    setModalChatId(chatId)
    setMessageText('')
    setMessages([])
    setMessagesLoading(true)
    getChatMessages(chatId, { limit: 100 })
      .then((res) => {
        setMessages(res.messages ?? [])
        const ch = res.chat
        const uni = (ch as { universityUserId?: string }).universityUserId
        const stud = (ch as { studentProfileId?: string }).studentProfileId
        if (uni) {
          setOfferContext({
            universityUserId: uni,
            studentProfileId: stud,
            chatId,
            studentLabel: (ch as { studentName?: string }).studentName,
          })
        } else {
          setOfferContext(null)
        }
      })
      .catch((e) => { toastApiError(e); setMessages([]) })
      .finally(() => setMessagesLoading(false))
  }, [])

  useEffect(() => {
    setLoading(true)
    getChats({ page, limit, universityId: selectedUniversityId || undefined })
      .then((res) => {
        setItems(res.data ?? [])
        setTotal(res.total ?? 0)
        setUniversities(res.universities ?? [])
      })
      .catch((e) => {
        toastApiError(e)
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, selectedUniversityId])

  useEffect(() => {
    if (!chatIdFromUrl) return
    openMessages(chatIdFromUrl)
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete('chatId')
      return p
    }, { replace: true })
  }, [chatIdFromUrl, openMessages, setSearchParams])

  const openOfferFromRow = (chatId: string) => {
    getChatMessages(chatId, { limit: 1 })
      .then((res) => {
        const ch = res.chat
        const uni = (ch as { universityUserId?: string }).universityUserId
        if (!uni) {
          toastApiError(new Error('Chat has no university user id'))
          return
        }
        setOfferContext({
          universityUserId: uni,
          studentProfileId: (ch as { studentProfileId?: string }).studentProfileId,
          chatId,
          studentLabel: (ch as { studentName?: string }).studentName,
        })
        setOfferModalOpen(true)
      })
      .catch(toastApiError)
  }

  const handleSendMessage = () => {
    if (!modalChatId || !messageText.trim() || sending) return
    setSending(true)
    sendAdminChatMessage(modalChatId, messageText.trim())
      .then((newMsg) => {
        const msg = newMsg as AdminChatMessage & { text?: string }
        setMessages((prev) => [...prev, {
          id: msg.id ?? `m-${Date.now()}`,
          chatId: modalChatId,
          type: msg.type ?? 'text',
          message: msg.message ?? msg.text ?? '',
          senderId: msg.senderId ?? '',
          createdAt: msg.createdAt ?? new Date().toISOString(),
        }])
        setMessageText('')
      })
      .catch(toastApiError)
      .finally(() => setSending(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:chats')} icon="MessageCircle" />

      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label={t('admin:universityProfile', 'University')}
            value={selectedUniversityId}
            onChange={(e) => { setSelectedUniversityId(e.target.value); setPage(1) }}
            placeholder={t('admin:allUniversities', 'All universities')}
            options={[{ value: '', label: t('admin:allUniversities', 'All universities') }, ...universities.map((u) => ({ value: u.id, label: u.name || u.id }))]}
            className="min-w-[200px]"
          />
        </div>
        <CardTitle>{t('admin:allChats', 'All chats')}</CardTitle>
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('admin:studentProfile', 'Student')}</TableTh>
                  <TableTh>{t('admin:universityProfile', 'University')}</TableTh>
                  <TableTh>{t('common:updated', 'Updated')}</TableTh>
                  <TableTh>{t('common:actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableTd>{(c as { studentName?: string }).studentName ?? c.studentId}</TableTd>
                    <TableTd>{(c as { universityName?: string }).universityName ?? c.universityId}</TableTd>
                    <TableTd>{c.updatedAt ? formatDateTime(c.updatedAt) : '—'}</TableTd>
                    <TableTd>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openMessages(c.id)}>
                          {t('admin:viewMessages', 'View messages')}
                        </Button>
                        {role === 'admin' ? (
                          <Button size="sm" onClick={() => openOfferFromRow(c.id)}>
                            {t('admin:sendOffer', 'Send offer')}
                          </Button>
                        ) : null}
                      </div>
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
        title={modalChatId ? t('admin:chatMessagesWithId', 'Chat messages') : t('admin:chatMessages', 'Chat messages')}
        footer={
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('common:typeMessage', 'Type a message...')}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                className="flex-1 min-w-0"
              />
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button onClick={handleSendMessage} disabled={!messageText.trim() || sending} loading={sending}>
                  {t('common:send', 'Send')}
                </Button>
                {role === 'admin' && offerContext?.universityUserId ? (
                  <Button variant="secondary" onClick={() => setOfferModalOpen(true)}>
                    {t('admin:sendOffer', 'Send offer')}
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={() => { setModalChatId(null); setOfferContext(null) }}>
                  {t('common:close')}
                </Button>
              </div>
            </div>
          </div>
        }
      >
        {messagesLoading ? (
          <p className="text-[var(--color-text-muted)]">{t('common:loading')}</p>
        ) : messages.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">{t('admin:noMessages', 'No messages.')}</p>
        ) : (
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
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

      {offerContext?.universityUserId ? (
        <AdminUniversityOfferModal
          open={offerModalOpen}
          onClose={() => setOfferModalOpen(false)}
          universityUserId={offerContext.universityUserId}
          initialStudentProfileId={offerContext.studentProfileId}
          initialChatId={offerContext.chatId ?? modalChatId ?? undefined}
          initialStudentLabel={offerContext.studentLabel}
        />
      ) : null}
    </div>
  )
}
