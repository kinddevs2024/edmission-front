import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getChats,
  getMessages,
  sendMessage,
  createChat,
  acceptStudent,
  updateMessage as updateChatMessage,
  deleteMessage as deleteChatMessage,
} from '@/services/chat'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/store/authStore'
import { ChatList } from './ChatList'
import { MessageThread } from './MessageThread'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { toastApiError } from '@/utils/toastError'
import type { Chat, Message } from '@/types/chat'

function getMessagePreview(message: Message): Chat['lastMessage'] {
  const text =
    message.type === 'voice'
      ? 'Voice message'
      : message.type === 'emotion'
        ? String(message.metadata?.emotion ?? 'Reaction')
        : message.text ?? ''

  return {
    id: message.id,
    text,
    createdAt: message.createdAt,
    isFromMe: message.isFromMe ?? false,
    read: message.read,
  }
}

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

  const { joinChat, leaveChat, onNewMessage, onRead, onNotification, onMessageUpdated, onMessageDeleted } = useSocket()

  const normalizeMessage = useCallback((message: Message | Record<string, unknown>) => {
    const raw = message as Message & { sender?: { id?: string; _id?: unknown }; senderId?: string | { _id?: unknown } }
    const senderIdObject =
      raw.senderId && typeof raw.senderId === 'object'
        ? (raw.senderId as { _id?: unknown })
        : undefined
    const senderId =
      raw.sender?.id ??
      (raw.sender && '_id' in raw.sender && raw.sender._id != null ? String(raw.sender._id) : undefined) ??
      (typeof raw.senderId === 'string'
        ? raw.senderId
        : senderIdObject?._id != null
          ? String(senderIdObject._id)
          : undefined)

    return {
      ...raw,
      id: String(raw.id ?? ''),
      text: String(raw.text ?? raw.message ?? ''),
      type: raw.type ?? 'text',
      createdAt: String(raw.createdAt ?? new Date().toISOString()),
      editedAt: raw.editedAt,
      isFromMe: raw.isFromMe ?? (!!currentUserId && senderId === currentUserId),
      sender: senderId ? { id: senderId } : raw.sender,
    } as Message
  }, [currentUserId])

  const loadChats = useCallback(
    async (options?: { selectedChatId?: string | null; selectChatId?: string; openThread?: boolean }) => {
      const roleOrStudent = role ?? 'student'
      const list = await getChats(roleOrStudent)
      setChats(list)

      const targetChatId = options?.selectChatId ?? options?.selectedChatId ?? null
      if (targetChatId) {
        const match = list.find((chat) => chat.id === targetChatId) ?? null
        setSelectedChat(match)
        if (match && options?.openThread) {
          setMobileView('thread')
        }
      } else if (list.length === 0) {
        setSelectedChat(null)
      }

      return list
    },
    [role]
  )

  const syncChatPreview = useCallback((chatId: string, nextMessages: Message[]) => {
    const lastMessage = nextMessages.length > 0 ? getMessagePreview(nextMessages[nextMessages.length - 1]!) : undefined

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              lastMessage,
              updatedAt: lastMessage?.createdAt ?? chat.updatedAt,
            }
          : chat
      )
    )

    setSelectedChat((prev) =>
      prev && prev.id === chatId
        ? {
            ...prev,
            lastMessage,
            updatedAt: lastMessage?.createdAt ?? prev.updatedAt,
          }
        : prev
    )
  }, [])

  useEffect(() => {
    loadChats()
      .catch((e) => { toastApiError(e); setChats([]) })
      .finally(() => setChatsLoading(false))
  }, [loadChats])

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

  useEffect(() => {
    const unsubscribe = onNotification((payload) => {
      const hasChatMetadata = typeof payload.metadata?.chatId === 'string' && payload.metadata.chatId.trim().length > 0
      if (payload.type !== 'message' && !hasChatMetadata) return

      const chatId =
        typeof payload.referenceId === 'string' && payload.referenceId.trim()
          ? payload.referenceId
          : hasChatMetadata && typeof payload.metadata?.chatId === 'string' && payload.metadata.chatId.trim()
            ? payload.metadata.chatId
            : undefined

      if (!chatId) return

      const shouldAutoOpen = payload.type === 'message' && payload.metadata?.subtype === 'chat_opened'
      loadChats({
        selectedChatId: selectedChat?.id ?? null,
        selectChatId: shouldAutoOpen ? chatId : undefined,
        openThread: shouldAutoOpen,
      }).catch(() => {})
    })

    return unsubscribe
  }, [onNotification, loadChats, selectedChat?.id])

  const isValidObjectId = (id: string | null) =>
    typeof id === 'string' && id.trim().length === 24 && /^[a-f0-9]{24}$/i.test(id.trim())

  useEffect(() => {
    const studentId = searchParams.get('studentId')
    const universityId = searchParams.get('universityId')
    const hasValidId = (studentId && isValidObjectId(studentId)) || (universityId && isValidObjectId(universityId))
    if (!hasValidId || !role || chatsLoading) return

    const params = studentId ? { studentId } : { universityId: universityId! }
    createChat(params)
      .then((chat) => {
        setChats((prev) => (
          prev.some((current) => current.id === chat.id)
            ? prev.map((current) => (current.id === chat.id ? { ...current, ...chat } : current))
            : [...prev, chat]
        ))
        setSelectedChat(chat)
        setMobileView('thread')
        setSearchParams({}, { replace: true })
      })
      .catch((e) => {
        toastApiError(e)
        setSearchParams({}, { replace: true })
      })
  }, [searchParams, role, chatsLoading, setSearchParams])

  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([])
      return
    }

    setMessagesLoading(true)
    joinChat(selectedChat.id)

    getMessages(selectedChat.id)
      .then((list) => {
        setMessages(list.map(normalizeMessage))
      })
      .catch((e) => { toastApiError(e); setMessages([]) })
      .finally(() => setMessagesLoading(false))

    return () => {
      leaveChat(selectedChat.id)
    }
  }, [selectedChat?.id, joinChat, leaveChat, normalizeMessage])

  useEffect(() => {
    const unsub = onNewMessage(({ chatId, message }) => {
      const normalized = normalizeMessage(message as Message)
      if (normalized.type !== 'system' && normalized.sender?.id && currentUserId && normalized.sender.id === currentUserId) {
        return
      }

      setMessages((prev) => {
        if (chatId !== selectedChat?.id) return prev
        if (prev.some((item) => item.id === normalized.id)) return prev
        const next = [...prev, normalized]
        syncChatPreview(chatId, next)
        return next
      })

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                lastMessage: getMessagePreview(normalized),
                unreadCount: chat.id === selectedChat?.id ? chat.unreadCount : chat.unreadCount + 1,
                updatedAt: normalized.createdAt,
              }
            : chat
        )
      )
    })

    return unsub
  }, [selectedChat?.id, onNewMessage, currentUserId, normalizeMessage, syncChatPreview])

  useEffect(() => {
    const unsub = onMessageUpdated(({ chatId, message }) => {
      const normalized = normalizeMessage(message as Message)

      setMessages((prev) => {
        if (chatId !== selectedChat?.id) return prev
        const next = prev.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
        syncChatPreview(chatId, next)
        return next
      })

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId && chat.lastMessage?.id === normalized.id
            ? {
                ...chat,
                lastMessage: getMessagePreview(normalized),
                updatedAt: normalized.createdAt,
              }
            : chat
        )
      )
    })

    return unsub
  }, [selectedChat?.id, onMessageUpdated, normalizeMessage, syncChatPreview])

  useEffect(() => {
    const unsub = onMessageDeleted(({ chatId, messageId }) => {
      setMessages((prev) => {
        if (chatId !== selectedChat?.id) return prev
        const next = prev.filter((message) => message.id !== messageId)
        syncChatPreview(chatId, next)
        return next
      })

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId && chat.lastMessage?.id === messageId && chatId !== selectedChat?.id
            ? {
                ...chat,
                lastMessage: undefined,
              }
            : chat
        )
      )
    })

    return unsub
  }, [selectedChat?.id, onMessageDeleted, syncChatPreview])

  useEffect(() => {
    const unsub = onRead(({ chatId }) => {
      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat))
      )
    })
    return unsub
  }, [onRead])

  const handleSend = useCallback(
    (params: string | import('@/services/chat').SendMessageParams) => {
      if (!selectedChat) return Promise.resolve()

      return sendMessage(selectedChat.id, params)
        .then((message) => {
          const normalized = normalizeMessage({ ...message, isFromMe: true })
          setMessages((prev) => {
            const next = [...prev, normalized]
            syncChatPreview(selectedChat.id, next)
            return next
          })
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === selectedChat.id
                ? {
                    ...chat,
                    lastMessage: getMessagePreview(normalized),
                    updatedAt: normalized.createdAt,
                  }
                : chat
            )
          )
        })
        .catch((error) => {
          toastApiError(error)
          throw error
        })
    },
    [selectedChat, normalizeMessage, syncChatPreview]
  )

  const handleUpdateMessage = useCallback(
    (messageId: string, text: string) => {
      if (!selectedChat) return Promise.resolve()

      return updateChatMessage(selectedChat.id, messageId, text)
        .then((message) => {
          const normalized = normalizeMessage({ ...message, isFromMe: true })
          setMessages((prev) => {
            const next = prev.map((item) => (item.id === messageId ? { ...item, ...normalized } : item))
            syncChatPreview(selectedChat.id, next)
            return next
          })
        })
        .catch((error) => {
          toastApiError(error)
          throw error
        })
    },
    [selectedChat, normalizeMessage, syncChatPreview]
  )

  const handleDeleteMessage = useCallback(
    (messageId: string, scope: 'me' | 'everyone') => {
      if (!selectedChat) return Promise.resolve()

      return deleteChatMessage(selectedChat.id, messageId, scope)
        .then(() => {
          setMessages((prev) => {
            const next = prev.filter((message) => message.id !== messageId)
            syncChatPreview(selectedChat.id, next)
            return next
          })
        })
        .catch((error) => {
          toastApiError(error)
          throw error
        })
    },
    [selectedChat, syncChatPreview]
  )

  const handleAcceptStudent = useCallback(
    (params: { positionType: 'budget' | 'grant' | 'other'; positionLabel?: string; congratulatoryMessage: string }) => {
      if (!selectedChat) return Promise.reject()
      return acceptStudent(selectedChat.id, params).then((res) => {
        const normalized = normalizeMessage(res.message)
        setMessages((prev) => {
          const next = [...prev, normalized]
          syncChatPreview(selectedChat.id, next)
          return next
        })
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  acceptedAt: res.chat.acceptedAt,
                  acceptancePositionType: res.chat.acceptancePositionType,
                  acceptancePositionLabel: res.chat.acceptancePositionLabel,
                  lastMessage: getMessagePreview(normalized),
                  updatedAt: normalized.createdAt,
                }
              : chat
          )
        )
        setSelectedChat((prev) =>
          prev && prev.id === selectedChat.id
            ? {
                ...prev,
                acceptedAt: res.chat.acceptedAt,
                acceptancePositionType: res.chat.acceptancePositionType,
                acceptancePositionLabel: res.chat.acceptancePositionLabel,
              }
            : prev
        )
      })
    },
    [selectedChat, normalizeMessage, syncChatPreview]
  )

  const handleMarkRead = useCallback(() => {
    if (!selectedChat?.id) return
    setChats((prev) =>
      prev.map((chat) => (chat.id === selectedChat.id ? { ...chat, unreadCount: 0 } : chat))
    )
  }, [selectedChat?.id])

  const showList = mobileView === 'list'
  const showThread = mobileView === 'thread'

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex-1 flex flex-col border border-[var(--color-border)] rounded-card bg-[var(--color-card)] overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <div
            className={cn(
              'flex flex-col h-full w-full md:w-80 md:max-w-sm bg-[var(--color-card)] overflow-hidden',
              showList ? 'flex' : 'hidden md:flex'
            )}
          >
            <div className="p-2 border-b border-[var(--color-border)] flex items-center gap-2 md:hidden">
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
            {selectedChat ? (
              <div className="p-2 border-b border-[var(--color-border)] flex items-center gap-2 md:hidden">
                <Button variant="ghost" size="sm" onClick={() => setMobileView('list')}>
                  {t('back')}
                </Button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{selectedChat.participant.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t('chats')}</p>
                </div>
              </div>
            ) : null}
            <MessageThread
              chat={selectedChat}
              messages={messages}
              loading={messagesLoading}
              onSend={handleSend}
              onUpdateMessage={handleUpdateMessage}
              onDeleteMessage={handleDeleteMessage}
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
