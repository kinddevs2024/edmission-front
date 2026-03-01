import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getChats, getMessages, sendMessage, markAsRead, createChat, acceptStudent } from '@/services/chat'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/store/authStore'
import { ChatList } from './ChatList'
import { MessageThread } from './MessageThread'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import type { Chat, Message } from '@/types/chat'

export function ChatView() {
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
      .catch(() => setChats([]))
      .finally(() => setChatsLoading(false))
  }, [role])

  useEffect(() => {
    const studentId = searchParams.get('studentId')
    const universityId = searchParams.get('universityId')
    if ((studentId || universityId) && role && chats.length >= 0 && !chatsLoading) {
      const existing = chats.find((c) =>
        studentId ? c.participant.id === studentId : universityId ? c.participant.id === universityId : false
      )
      if (existing) {
        setSelectedChat(existing)
        setMobileView('thread')
        setSearchParams({}, { replace: true })
      } else {
        createChat(studentId ? { studentId } : { universityId: universityId! })
          .then((chat) => {
            setChats((prev) => (prev.some((c) => c.id === chat.id) ? prev : [...prev, chat]))
            setSelectedChat(chat)
            setMobileView('thread')
            setSearchParams({}, { replace: true })
          })
          .catch(() => setSearchParams({}, { replace: true }))
      }
    }
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
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false))
    return () => {
      leaveChat(selectedChat.id)
    }
  }, [selectedChat?.id, currentUserId, joinChat, leaveChat])

  useEffect(() => {
    const unsub = onNewMessage(({ chatId, message }) => {
      const msg = message as Message
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
  }, [selectedChat?.id, onNewMessage])

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
        .catch(() => {})
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
    if (selectedChat?.id) {
      markAsRead(selectedChat.id).catch(() => {})
      setChats((prev) =>
        prev.map((c) => (c.id === selectedChat.id ? { ...c, unreadCount: 0 } : c))
      )
    }
  }, [selectedChat?.id])

  const showList = mobileView === 'list'
  const showThread = mobileView === 'thread'

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex flex-1 min-h-0 border border-[var(--color-border)] rounded-card overflow-hidden bg-[var(--color-card)]">
        <div
          className={cn(
            'flex flex-col w-full md:w-80 md:max-w-sm border-r border-[var(--color-border)] bg-[var(--color-card)]',
            showList ? 'flex' : 'hidden md:flex'
          )}
        >
          <div className="p-2 border-b border-[var(--color-border)] flex items-center gap-2 md:hidden">
            {showThread && (
              <Button variant="ghost" size="sm" onClick={() => setMobileView('list')}>
                Back
              </Button>
            )}
            <span className="font-medium">Chats</span>
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
            'flex-1 flex flex-col min-w-0',
            showThread ? 'flex' : 'hidden md:flex'
          )}
        >
          <div className="p-2 border-b border-[var(--color-border)] flex items-center gap-2 md:hidden">
            {showList && selectedChat && (
              <Button variant="ghost" size="sm" onClick={() => setMobileView('thread')}>
                Open
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
  )
}
