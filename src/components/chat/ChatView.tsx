import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getChats, getMessages, sendMessage, createChat, acceptStudent } from '@/services/chat'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/store/authStore'
import { ChatList } from './ChatList'
import { MessageThread } from './MessageThread'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { toastApiError } from '@/utils/toastError'
import type { Chat, Message } from '@/types/chat'

export function ChatView() {
  const { t } = useTranslation('common')
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const role = useAuthStore((s) => s.user?.role) as 'student' | 'university' | undefined
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  const { joinChat, leaveChat, onNewMessage, onRead } = useSocket()

  useEffect(() => {
    const roleOrStudent = role ?? 'student'
    getChats(roleOrStudent)
      .then(setChats)
      .catch((e) => { toastApiError(e); setChats([]) })
      .finally(() => setChatsLoading(false))
  }, [role])

  useEffect(() => {
    const chatId = searchParams.get('chat')
    if (chatId && chats.length > 0 && !chatsLoading) {
      const existing = chats.find((c) => c.id === chatId)
      if (existing) {
        setSelectedChat(existing)
        setMobileView('thread')
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, chats, chatsLoading, setSearchParams])

  // MongoDB ObjectId: 24 hex chars (required for createChat)
  const isValidObjectId = (id: string | null) =>
    typeof id === 'string' && id.trim().length === 24 && /^[a-f0-9]{24}$/i.test(id.trim())

  useEffect(() => {
    const studentId = searchParams.get('studentId')
    const universityId = searchParams.get('universityId')
    const hasValidId = (studentId && isValidObjectId(studentId)) || (universityId && isValidObjectId(universityId))
    if (!hasValidId || !role || chatsLoading) return

    const existing = chats.find((c) =>
      studentId ? c.participant.id === studentId : universityId ? c.participant.id === universityId : false
    )
    if (existing) {
      setSelectedChat(existing)
      setMobileView('thread')
      setSearchParams({}, { replace: true })
      return
    }
    const params = studentId ? { studentId } : { universityId: universityId! }
    createChat(params)
      .then((chat) => {
        setChats((prev) => (prev.some((c) => c.id === chat.id) ? prev : [...prev, chat]))
        setSelectedChat(chat)
        setMobileView('thread')
        setSearchParams({}, { replace: true })
      })
      .catch((e) => {
        toastApiError(e)
        setSearchParams({}, { replace: true })
      })
  }, [searchParams, role, chats, chatsLoading, setSearchParams])

  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([])
      return
    }
    setMessagesLoading(true)
    joinChat(selectedChat.id)
    getMessages(selectedChat.id)
      .then((list) => {
        const withIsFromMe = list.map((m) => ({
          ...m,
          isFromMe: (() => {
          const s = (m as { sender?: { id?: string; _id?: unknown } }).sender
          const sid = s?.id ?? (s?._id != null ? String(s._id) : undefined)
          return m.isFromMe ?? (currentUserId != null && sid === currentUserId)
        })(),
        }))
        setMessages(withIsFromMe)
      })
      .catch((e) => { toastApiError(e); setMessages([]) })
      .finally(() => setMessagesLoading(false))
    return () => {
      leaveChat(selectedChat.id)
    }
  }, [selectedChat?.id, currentUserId, joinChat, leaveChat])

  useEffect(() => {
    const unsub = onNewMessage(({ chatId, message }) => {
      const msg = message as Message

      // Если это сообщение от текущего пользователя, мы уже добавили его в handleSend → игнорируем сокетное дублирование
      const senderId = (msg as { sender?: { id?: string } }).sender?.id
      if (senderId && currentUserId && senderId === currentUserId) return

      const preview = msg.type === 'voice' ? '🎤 Voice' : msg.type === 'emotion' ? (msg.metadata?.emotion ?? '👍') : (msg.text ?? '')
      setMessages((prev) => {
        if (chatId !== selectedChat?.id) return prev
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, { ...msg, isFromMe: false }]
      })
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                lastMessage: {
                  text: preview,
                  createdAt: msg.createdAt,
                  isFromMe: false,
                },
                unreadCount: c.id === selectedChat?.id ? c.unreadCount : c.unreadCount + 1,
                updatedAt: msg.createdAt,
              }
            : c
        )
      )
    })
    return unsub
  }, [selectedChat?.id, onNewMessage, currentUserId])

  useEffect(() => {
    const unsub = onRead(({ chatId }) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
      )
    })
    return unsub
  }, [onRead])

  const handleSend = useCallback(
    (params: string | import('@/services/chat').SendMessageParams) => {
      if (!selectedChat) return
      sendMessage(selectedChat.id, params)
        .then((msg) => {
          setMessages((prev) => [...prev, { ...msg, isFromMe: true }])
          const preview = typeof params === 'string' ? params : (params.type === 'voice' ? '🎤 Voice' : params.type === 'emotion' ? String(params.metadata?.emotion ?? '') : (params.text ?? ''))
          setChats((prev) =>
            prev.map((c) =>
              c.id === selectedChat.id
                ? {
                    ...c,
                    lastMessage: { text: preview, createdAt: msg.createdAt, isFromMe: true },
                    updatedAt: msg.createdAt,
                  }
                : c
            )
          )
        })
        .catch(toastApiError)
    },
    [selectedChat]
  )

  const handleAcceptStudent = useCallback(
    (params: { positionType: 'budget' | 'grant' | 'other'; positionLabel?: string; congratulatoryMessage: string }) => {
      if (!selectedChat) return Promise.reject()
      return acceptStudent(selectedChat.id, params).then((res) => {
        setMessages((prev) => [...prev, { ...res.message, isFromMe: false }])
        setChats((prev) =>
          prev.map((c) =>
            c.id === selectedChat.id
              ? { ...c, acceptedAt: res.chat.acceptedAt, acceptancePositionType: res.chat.acceptancePositionType, acceptancePositionLabel: res.chat.acceptancePositionLabel }
              : c
          )
        )
        setSelectedChat((prev) =>
          prev && prev.id === selectedChat.id
            ? { ...prev, acceptedAt: res.chat.acceptedAt, acceptancePositionType: res.chat.acceptancePositionType, acceptancePositionLabel: res.chat.acceptancePositionLabel }
            : prev
        )
      })
    },
    [selectedChat]
  )

  const handleMarkRead = useCallback(() => {
    if (!selectedChat?.id) return
    // Локально сбрасываем счётчик непрочитанных, чтобы избежать 500-ошибки /chat/:id/read
    setChats((prev) =>
      prev.map((c) => (c.id === selectedChat.id ? { ...c, unreadCount: 0 } : c))
    )
  }, [selectedChat?.id])

  const showList = mobileView === 'list'
  const showThread = mobileView === 'thread'

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex-1  flex flex-col border border-[var(--color-border)] rounded-card bg-[var(--color-card)] overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            'flex flex-col h-full w-full  md:w-80 md:max-w-sm bg-[var(--color-card)] overflow-hidden',
            showList ? 'flex' : 'hidden md:flex'
          )}
        >
          <div className="p-2 border-b border-[var(--color-border)] flex items-center gap-2 md:hidden">
            {showThread && (
              <Button variant="ghost" size="sm" onClick={() => setMobileView('list')}>
                {t('back')}
              </Button>
            )}
            <span className="font-medium">{t('chats')}</span>
          </div>
          <ChatList
            chats={chats}
            selectedId={selectedChat?.id ?? null}
            onSelect={(chat) => {
              setSelectedChat(chat)
              setMobileView('thread')
            }}
            loading={chatsLoading}
          />
        </div>
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[var(--color-card)] border-l border-[var(--color-border)]',
            showThread ? 'flex' : 'hidden md:flex'
          )}
        >
          <div className="p-2 border-b border-[var(--color-border)] flex items-center gap-2 md:hidden">
            {showList && selectedChat && (
              <Button variant="ghost" size="sm" onClick={() => setMobileView('thread')}>
                {t('open')}
              </Button>
            )}
          </div>
          <MessageThread
            chat={selectedChat}
            messages={messages}
            loading={messagesLoading}
            onSend={handleSend}
            onMarkRead={handleMarkRead}
            isTyping={false}
            role={role}
            onAcceptStudent={role === 'university' ? handleAcceptStudent : undefined}
          />
        </div>
        </div>
      </div>
    </div>
  )
}
