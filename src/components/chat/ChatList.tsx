import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { getImageUrl } from '@/services/upload'
import type { Chat } from '@/types/chat'

interface ChatListProps {
  chats: Chat[]
  selectedId: string | null
  onSelect: (chat: Chat) => void
  loading?: boolean
}

export function ChatList({ chats, selectedId, onSelect, loading }: ChatListProps) {
  if (loading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-input bg-[var(--color-border)] animate-pulse" />
        ))}
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-[var(--color-text-muted)] text-sm">
        No conversations yet.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {chats.map((chat) => (
        <li key={chat.id}>
          <button
            type="button"
            onClick={() => onSelect(chat)}
            className={cn(
              'w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--color-border)]/20 transition-colors',
              selectedId === chat.id && 'bg-primary-accent/10'
            )}
          >
            {chat.participant.avatar ? (
              <img
                src={getImageUrl(chat.participant.avatar)}
                alt=""
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--color-border)] flex-shrink-0 flex items-center justify-center text-sm font-medium text-[var(--color-text-muted)]">
                {chat.participant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate flex items-center gap-1.5">
                {chat.participant.name}
                {chat.acceptedAt && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-accent/20 text-primary-accent font-medium shrink-0">
                    Accepted
                  </span>
                )}
              </p>
              {chat.lastMessage && (
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {chat.lastMessage.isFromMe ? 'You: ' : ''}{chat.lastMessage.text}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              {chat.lastMessage && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatDate(chat.lastMessage.createdAt)}
                </p>
              )}
              {chat.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-accent text-primary-dark text-xs font-medium">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
