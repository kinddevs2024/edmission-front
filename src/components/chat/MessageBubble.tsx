import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'
import type { Message } from '@/types/chat'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isFromMe = message.isFromMe ?? false

  return (
    <div
      className={cn(
        'flex w-full',
        isFromMe ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-card px-3 py-2 text-sm',
          isFromMe
            ? 'bg-primary-accent text-primary-dark'
            : 'bg-[var(--color-border)] text-[var(--color-text)]'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p
          className={cn(
            'text-xs mt-1',
            isFromMe ? 'text-primary-dark/70' : 'text-[var(--color-text-muted)]'
          )}
        >
          {formatDateTime(message.createdAt)}
          {message.read && isFromMe && ' · Read'}
        </p>
      </div>
    </div>
  )
}
