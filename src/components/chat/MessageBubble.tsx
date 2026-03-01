import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'
import type { Message } from '@/types/chat'

interface MessageBubbleProps {
  message: Message
}

const EMOJI_SIZE = 'text-4xl'

export function MessageBubble({ message }: MessageBubbleProps) {
  const isFromMe = message.isFromMe ?? false
  const type = message.type ?? 'text'
  const displayText = message.text ?? message.message ?? ''

  if (type === 'system') {
    const meta = message.metadata
    const isAcceptance = meta?.subtype === 'acceptance'
    return (
      <div className="flex w-full justify-center my-2">
        <div
          className={cn(
            'max-w-[85%] rounded-card px-4 py-3 text-center text-sm',
            'bg-[var(--color-border)]/50 border border-[var(--color-border)]',
            isAcceptance && 'bg-primary-accent/15 border-primary-accent/40'
          )}
        >
          {isAcceptance && (
            <p className="text-lg mb-1" aria-hidden>🎓</p>
          )}
          <p className="whitespace-pre-wrap break-words font-medium">{displayText}</p>
          {isAcceptance && meta?.congratulatoryMessage && (
            <p className="mt-2 text-[var(--color-text-muted)] whitespace-pre-wrap border-t border-[var(--color-border)] pt-2">
              {meta.congratulatoryMessage}
            </p>
          )}
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {formatDateTime(message.createdAt)}
          </p>
        </div>
      </div>
    )
  }

  if (type === 'emotion') {
    const emoji = (message.metadata?.emotion ?? displayText) || '👍'
    return (
      <div
        className={cn(
          'flex w-full',
          isFromMe ? 'justify-end' : 'justify-start'
        )}
      >
        <div
          className={cn(
            'rounded-card px-4 py-3 flex items-center justify-center min-w-[80px]',
            isFromMe
              ? 'bg-primary-accent/20 text-primary-accent'
              : 'bg-[var(--color-border)]/50'
          )}
        >
          <span className={EMOJI_SIZE} role="img" aria-label="Reaction">{emoji}</span>
          <p className="text-xs text-[var(--color-text-muted)] ml-2">
            {formatDateTime(message.createdAt)}
          </p>
        </div>
      </div>
    )
  }

  if (type === 'voice') {
    return (
      <div
        className={cn(
          'flex w-full',
          isFromMe ? 'justify-end' : 'justify-start'
        )}
      >
        <div
          className={cn(
            'max-w-[75%] rounded-card px-3 py-2 text-sm flex flex-col gap-2',
            isFromMe
              ? 'bg-primary-accent text-primary-dark'
              : 'bg-[var(--color-border)] text-[var(--color-text)]'
          )}
        >
          <audio
            controls
            src={message.attachmentUrl}
            className="max-w-full h-9"
            preload="metadata"
          />
          <p className={cn('text-xs', isFromMe ? 'text-primary-dark/70' : 'text-[var(--color-text-muted)]')}>
            {formatDateTime(message.createdAt)}
            {message.read && isFromMe && ' · Read'}
          </p>
        </div>
      </div>
    )
  }

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
        <p className="whitespace-pre-wrap break-words">{displayText}</p>
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
