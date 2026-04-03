import { useMemo } from 'react'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { getImageUrl } from '@/services/upload'
import { useTranslation } from 'react-i18next'
import type { Chat } from '@/types/chat'

interface ChatListProps {
  chats: Chat[]
  selectedId: string | null
  onSelect: (chat: Chat) => void
  loading?: boolean
}

function sortChatsByRecent(list: Chat[]): Chat[] {
  return [...list].sort((a, b) => {
    const aUnread = a.unreadCount > 0 ? 1 : 0
    const bUnread = b.unreadCount > 0 ? 1 : 0
    if (aUnread !== bUnread) return bUnread - aUnread
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount
    const ta = Date.parse(a.updatedAt) || 0
    const tb = Date.parse(b.updatedAt) || 0
    return tb - ta
  })
}

function formatUnreadBadge(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

export function ChatList({ chats, selectedId, onSelect, loading }: ChatListProps) {
  const { t } = useTranslation('common')
  const sortedChats = useMemo(() => sortChatsByRecent(chats), [chats])

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col space-y-3 p-2 md:space-y-2 md:p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[4.5rem] shrink-0 rounded-2xl bg-[var(--color-border)] animate-pulse md:h-16" />
        ))}
      </div>
    )
  }

  if (sortedChats.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center p-4 text-center text-sm text-[var(--color-text-muted)] md:text-sm">
        {t('noConversationsYet', 'No conversations yet.')}
      </div>
    )
  }

  return (
    <ul className="flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto overscroll-y-contain p-2 pb-2 md:gap-2 md:p-3 [touch-action:pan-y]">
      {sortedChats.map((chat) => (
        <li key={chat.id} className="shrink-0">
          <button
            type="button"
            onClick={() => onSelect(chat)}
            className={cn(
              'flex w-full min-h-[4.25rem] items-center gap-3 rounded-2xl border border-transparent px-3 py-3.5 text-left transition-all duration-200 active:bg-[var(--color-border)]/35 hover:border-[var(--color-border)] hover:bg-[var(--color-border)]/20 md:min-h-0 md:py-3',
              selectedId === chat.id && 'border-primary-accent/30 bg-primary-accent/10 shadow-[0_10px_24px_-18px_rgba(132,204,22,0.6)]'
            )}
          >
            {chat.participant.avatar ? (
              <img
                src={getImageUrl(chat.participant.avatar)}
                loading="lazy"
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover md:h-10 md:w-10"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-base font-semibold text-[var(--color-text-muted)] md:h-10 md:w-10 md:text-sm">
                {chat.participant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-base font-semibold leading-snug md:text-sm md:font-medium">
                {chat.participant.name}
                {chat.acceptedAt && (
                  <span className="shrink-0 rounded bg-primary-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-accent">
                    Accepted
                  </span>
                )}
              </p>
              {chat.lastMessage && (
                <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)] md:text-xs">
                  {chat.lastMessage.isFromMe ? 'You: ' : ''}{chat.lastMessage.text}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
              {chat.lastMessage && (
                <p className="text-xs text-[var(--color-text-muted)] md:text-[11px]">
                  {formatDate(chat.lastMessage.createdAt)}
                </p>
              )}
              {chat.unreadCount > 0 ? (
                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary-accent px-1.5 text-xs font-semibold tabular-nums leading-none text-primary-dark md:h-5 md:text-[11px]">
                  {formatUnreadBadge(chat.unreadCount)}
                </span>
              ) : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
