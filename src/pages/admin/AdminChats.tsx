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
import { deleteAdminChat, getChats, getChatMessages, sendAdminChatMessage, type AdminChat, type AdminChatMessage } from '@/services/admin'
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
  const [activeChat, setActiveChat] = useState<AdminChat | null>(null)
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
  const canSendInCurrentChat = role === 'admin' && Boolean(modalChatId)

  const toDisplayText = (value: unknown): string => {
    if (value == null) return '-'
    if (typeof value === 'string') return value.trim() ? value : '-'
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'object') {
      const obj = value as { id?: unknown; _id?: unknown }
      if (obj.id != null) return String(obj.id)
      if (obj._id != null) return String(obj._id)
    }
    return String(value)
  }

  const cleanText = (value: unknown): string => {
    const text = toDisplayText(value).trim()
    if (!text || text === '-' || text === '[object Object]' || /\{\{.*\}\}/.test(text)) return ''
    return text
  }

  const displayDate = (value: unknown): string => {
    if (typeof value !== 'string' || !value.trim()) return 'No date'
    const formatted = formatDateTime(value)
    return formatted && formatted !== 'вЂ”' && formatted !== '—' ? formatted : 'No date'
  }

  const getStudentLabel = (chat?: AdminChat | null) =>
    cleanText(chat?.studentName) || cleanText(chat?.studentEmail) || 'Unknown student'

  const getUniversityLabel = (chat?: AdminChat | null) =>
    cleanText(chat?.universityName) || cleanText(chat?.universityEmail) || 'Unknown university'

  const getSenderLabel = (message: AdminChatMessage) => {
    if (message.sentByAdmin || message.senderRole === 'admin') return `Admin${message.senderEmail ? ` (${message.senderEmail})` : ''}`
    const sender = cleanText(message.senderName) || cleanText(message.senderEmail) || cleanText(message.senderId)
    return sender || 'Unknown sender'
  }

  const toMessageText = (value: unknown): string => {
    if (value == null) return ''
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (value instanceof Uint8Array) {
      try {
        return new TextDecoder().decode(value)
      } catch {
        return ''
      }
    }
    if (typeof value === 'object') {
      const obj = value as { text?: unknown; message?: unknown; buffer?: unknown; type?: unknown; data?: unknown }
      const direct = obj.message ?? obj.text
      if (typeof direct === 'string' || typeof direct === 'number' || typeof direct === 'boolean') return String(direct)
      if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        try {
          return new TextDecoder().decode(new Uint8Array(obj.data.map((n) => Number(n))))
        } catch {
          return ''
        }
      }
      if (Array.isArray(obj.buffer)) {
        try {
          return new TextDecoder().decode(new Uint8Array(obj.buffer.map((n) => Number(n))))
        } catch {
          return ''
        }
      }
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  const openMessages = useCallback((chatId: string, chat?: AdminChat) => {
    setModalChatId(chatId)
    setActiveChat(chat ?? null)
    setMessageText('')
    setMessages([])
    setOfferContext(null)
    setMessagesLoading(true)
    getChatMessages(chatId, { limit: 100 })
      .then((res) => {
        setMessages((res.messages ?? []).map((msg) => {
          const raw = msg as AdminChatMessage & { text?: unknown; message?: unknown; senderId?: unknown }
          return {
            ...msg,
            senderId: toDisplayText(raw.senderId ?? ''),
            message: toMessageText(raw.message ?? raw.text),
            senderName: cleanText(raw.senderName),
            senderEmail: cleanText(raw.senderEmail),
            senderRole: cleanText(raw.senderRole),
            sentByAdmin: Boolean(raw.sentByAdmin),
          }
        }))
        const ch = res.chat
        setActiveChat((prev) => ({ ...(prev ?? {} as AdminChat), ...ch }))
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
    if (/^[a-fA-F0-9]{24}$/.test(chatIdFromUrl)) {
      openMessages(chatIdFromUrl)
    }
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete('chatId')
      return p
    }, { replace: true })
  }, [chatIdFromUrl, openMessages, setSearchParams])

  const handleSendMessage = () => {
    if (!canSendInCurrentChat || !modalChatId || !messageText.trim() || sending) return
    setSending(true)
    sendAdminChatMessage(modalChatId, messageText.trim())
      .then((newMsg) => {
        const msg = newMsg as AdminChatMessage & { text?: unknown; senderId?: unknown }
        setMessages((prev) => [...prev, {
          id: msg.id ?? `m-${Date.now()}`,
          chatId: modalChatId,
          type: msg.type ?? 'text',
          message: toMessageText(msg.message ?? msg.text ?? ''),
          senderId: toDisplayText(msg.senderId ?? ''),
          senderName: cleanText(msg.senderName),
          senderEmail: cleanText(msg.senderEmail),
          senderRole: cleanText(msg.senderRole || 'admin'),
          sentByAdmin: true,
          createdAt: msg.createdAt ?? new Date().toISOString(),
        }])
        setMessageText('')
      })
      .catch(toastApiError)
      .finally(() => setSending(false))
  }

  const handleDeleteChat = (chat: AdminChat) => {
    const label = `${getStudentLabel(chat)} -> ${getUniversityLabel(chat)}`
    if (!window.confirm(`Delete chat ${label}?`)) return
    deleteAdminChat(chat.id)
      .then(() => {
        setItems((prev) => prev.filter((item) => item.id !== chat.id))
        setTotal((prev) => Math.max(0, prev - 1))
        if (modalChatId === chat.id) {
          setModalChatId(null)
          setActiveChat(null)
          setOfferContext(null)
          setMessages([])
        }
      })
      .catch(toastApiError)
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
                  <TableTh>{t('admin:participants', 'Who with whom')}</TableTh>
                  <TableTh>Email</TableTh>
                  <TableTh>{t('common:created', 'Created')}</TableTh>
                  <TableTh>{t('common:updated', 'Updated')}</TableTh>
                  <TableTh>{t('common:actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableTd>
                      <div className="text-sm font-medium">{getStudentLabel(c)}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">to {getUniversityLabel(c)}</div>
                    </TableTd>
                    <TableTd>
                      <div className="text-xs">
                        <div>Student: {cleanText(c.studentEmail) || 'No email'}</div>
                        <div>University: {cleanText(c.universityEmail) || 'No email'}</div>
                      </div>
                    </TableTd>
                    <TableTd>{displayDate(c.createdAt)}</TableTd>
                    <TableTd>{displayDate(c.updatedAt)}</TableTd>
                    <TableTd>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openMessages(c.id, c)}>
                          {t('admin:openChat', 'Open chat')}
                        </Button>
                        {role === 'admin' ? (
                          <Button size="sm" variant="danger" onClick={() => handleDeleteChat(c)}>
                            {t('common:delete', 'Delete')}
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
        onClose={() => { setModalChatId(null); setActiveChat(null); setOfferContext(null); setMessageText(''); setMessages([]) }}
        title={`${getStudentLabel(activeChat)} -> ${getUniversityLabel(activeChat)}`}
        footer={
          <div className="flex flex-col gap-2 w-full">
            {canSendInCurrentChat ? (
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
                  <Button variant="secondary" onClick={() => setOfferModalOpen(true)}>
                    {t('admin:sendOffer', 'Send offer')}
                  </Button>
                  <Button variant="secondary" onClick={() => { setModalChatId(null); setActiveChat(null); setOfferContext(null); setMessageText(''); setMessages([]) }}>
                    {t('common:close')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {role === 'admin'
                    ? t('admin:chatReadonlyNoUniversity', 'Cannot send messages in this chat: university account is missing.')
                    : t('common:viewOnly', 'View only')}
                </p>
                <Button variant="secondary" onClick={() => { setModalChatId(null); setActiveChat(null); setOfferContext(null); setMessageText(''); setMessages([]) }}>
                  {t('common:close')}
                </Button>
              </div>
            )}
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
                  <span>{getSenderLabel(m)}</span>
                  <span>{displayDate(m.createdAt)}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{toMessageText(m.message)}</p>
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
