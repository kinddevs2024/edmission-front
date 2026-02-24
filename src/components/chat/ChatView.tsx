import { useState, useEffect, useCallback } from 'react'
import { getChats, getMessages, sendMessage, markAsRead } from '@/services/chat'
import { useSocket } from '@/hooks/useSocket'
import { ChatList } from './ChatList'
import { MessageThread } from './MessageThread'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import type { Chat, Message } from '@/types/chat'

export function ChatView() {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  const { joinChat, leaveChat, onNewMessage, onRead } = useSocket()

  useEffect(() => {
    getChats()
      .then(setChats)
      .catch(() => setChats([]))
      .finally(() => setChatsLoading(false))
  }, [])

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
          isFromMe: m.isFromMe,
        }))
        setMessages(withIsFromMe)
      })
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false))
    return () => {
      leaveChat(selectedChat.id)
    }
  }, [selectedChat?.id, joinChat, leaveChat])

  useEffect(() => {
    const unsub = onNewMessage(({ chatId, message }) => {
      const msg = message as Message
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
                  text: msg.text,
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
    (text: string) => {
      if (!selectedChat) return
      sendMessage(selectedChat.id, text)
        .then((msg) => {
          setMessages((prev) => [...prev, { ...msg, isFromMe: true }])
          setChats((prev) =>
            prev.map((c) =>
              c.id === selectedChat.id
                ? {
                    ...c,
                    lastMessage: { text: msg.text, createdAt: msg.createdAt, isFromMe: true },
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
          />
        </div>
      </div>
    </div>
  )
}
