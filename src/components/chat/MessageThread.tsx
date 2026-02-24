import { useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/Button'
import type { Chat, Message } from '@/types/chat'

interface MessageThreadProps {
  chat: Chat | null
  messages: Message[]
  loading?: boolean
  onSend: (text: string) => void
  onMarkRead?: () => void
  isTyping?: boolean
}

export function MessageThread({
  chat,
  messages,
  loading,
  onSend,
  onMarkRead,
  isTyping,
}: MessageThreadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (chat?.id && onMarkRead) onMarkRead()
  }, [chat?.id, onMarkRead])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputRef.current?.value?.trim()
    if (!text || !chat) return
    onSend(text)
    inputRef.current!.value = ''
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg)]">
        Select a conversation
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg)]">
      <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <p className="font-medium">{chat.participant.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-card bg-[var(--color-border)] animate-pulse max-w-[75%]" />
            ))}
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-card px-3 py-2 bg-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
              typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="flex-1 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            disabled={loading}
          />
          <Button type="submit" size="sm">
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
