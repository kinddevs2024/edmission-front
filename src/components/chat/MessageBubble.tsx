import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { formatDateTime, formatChatMessageTime } from '@/utils/format'
import { getImageUrl } from '@/services/upload'
import { Check, CheckCheck, ExternalLink, FileText } from 'lucide-react'
import type { Message } from '@/types/chat'

interface MessageBubbleProps {
  message: Message
}

const EMOJI_SIZE = 'text-4xl'

function formatAttachmentSize(value: unknown) {
  const bytes = typeof value === 'number' && Number.isFinite(value) ? value : 0
  if (bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentLink({ message, isFromMe }: { message: Message; isFromMe: boolean }) {
  if (!message.attachmentUrl) return null
  const href = getImageUrl(message.attachmentUrl)
  const fileName = message.metadata?.fileName || 'Attached file'
  const fileSize = formatAttachmentSize(message.metadata?.fileSize)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'mt-2 flex max-w-full items-center gap-3 rounded-card border px-3 py-2 text-left transition',
        isFromMe
          ? 'border-primary-dark/20 bg-primary-dark/10 hover:bg-primary-dark/15'
          : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-border)]/20'
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-[var(--color-card)] text-primary-accent">
        <FileText className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{fileName}</span>
        {fileSize ? <span className="block text-xs opacity-75">{fileSize}</span> : null}
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 opacity-75" aria-hidden />
    </a>
  )
}

function OutgoingStatusFooter({
  createdAt,
  editedAt,
  read,
  mutedClass,
}: {
  createdAt: string
  editedAt?: string
  read?: boolean
  mutedClass: string
}) {
  const time = formatChatMessageTime(createdAt)
  return (
    <p className={cn('text-xs mt-1 inline-flex flex-wrap items-center gap-x-1 gap-y-0.5', mutedClass)}>
      {time ? <span>{time}</span> : null}
      {editedAt ? <span>· Edited</span> : null}
      <span className="inline-flex items-center shrink-0" title={read ? 'Read' : 'Sent'} aria-label={read ? 'Read' : 'Sent'}>
        {read ? (
          <CheckCheck className="w-3.5 h-3.5 opacity-95" strokeWidth={2.5} aria-hidden />
        ) : (
          <Check className="w-3.5 h-3.5 opacity-75" strokeWidth={2.5} aria-hidden />
        )}
      </span>
    </p>
  )
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isFromMe = message.isFromMe ?? false
  const type = message.type ?? 'text'
  const displayText = message.text ?? message.message ?? ''
  const replyPreview = message.metadata?.replyToPreview?.trim()
  const isAdminMessage = message.metadata?.sentByAdmin || message.metadata?.senderRole === 'admin'
  const adminLabel = message.metadata?.senderLabel || 'Admin'

  const replyBlock = replyPreview ? (
    <div
      className={cn(
        'mb-2 rounded-2xl border px-3 py-2 text-xs',
        isFromMe
          ? 'border-primary-dark/20 bg-primary-dark/10 text-primary-dark/80'
          : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]'
      )}
    >
      <p className="font-medium mb-1">Reply</p>
      <p className="line-clamp-2 whitespace-pre-wrap break-words">{replyPreview}</p>
    </div>
  ) : null

  if (type === 'system') {
    const meta = message.metadata
    const isAcceptance = meta?.subtype === 'acceptance'
    const isChatBlocked = meta?.subtype === 'chat_blocked'
    const isUniversityArea = typeof window !== 'undefined' && window.location.pathname.startsWith('/university')
    const documentLink = meta?.link ?? (
      meta?.documentId
        ? (isUniversityArea ? `/university/documents?documentId=${meta.documentId}` : `/student/received-documents/${meta.documentId}`)
        : undefined
    )

    return (
      <div className="flex w-full justify-center my-2">
        <div
          className={cn(
            'max-w-[85%] rounded-card px-4 py-3 text-center text-sm',
            'bg-[var(--color-border)]/50 border border-[var(--color-border)]',
            isAcceptance && 'bg-primary-accent/15 border-primary-accent/40',
            isChatBlocked && 'bg-rose-500/10 border-rose-500/30'
          )}
        >
          {isAcceptance && (
            <p className="text-lg mb-1" aria-hidden>{'\u{1F393}'}</p>
          )}
          <p className="whitespace-pre-wrap break-words font-medium">{displayText}</p>
          {isAcceptance && meta?.congratulatoryMessage && (
            <p className="mt-2 text-[var(--color-text-muted)] whitespace-pre-wrap border-t border-[var(--color-border)] pt-2">
              {meta.congratulatoryMessage}
            </p>
          )}
          {documentLink ? (
            <div className="mt-3">
              <Link
                to={documentLink}
                className="inline-flex rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-primary-accent hover:bg-primary-accent/10"
              >
                Open document
              </Link>
            </div>
          ) : null}
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDateTime(message.createdAt)}</p>
        </div>
      </div>
    )
  }

  if (type === 'emotion') {
    const emoji = (message.metadata?.emotion ?? displayText) || '\u{1F44D}'

    return (
      <div className={cn('flex w-full', isFromMe ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'rounded-card px-4 py-3 flex min-w-[80px]',
            replyBlock ? 'flex-col items-start gap-2' : isFromMe ? 'flex-col items-end gap-1' : 'items-center justify-center',
            isFromMe ? 'bg-primary-accent/20 text-primary-accent' : 'bg-[var(--color-border)]/50'
          )}
        >
          {replyBlock}
          <span className={EMOJI_SIZE} role="img" aria-label="Reaction">{emoji}</span>
          {isFromMe ? (
            <OutgoingStatusFooter
              createdAt={message.createdAt}
              editedAt={message.editedAt}
              read={message.read}
              mutedClass="text-[var(--color-text-muted)]"
            />
          ) : (
            <p className={cn('text-xs text-[var(--color-text-muted)]', replyBlock ? '' : 'ml-2')}>
              {formatChatMessageTime(message.createdAt) || formatDateTime(message.createdAt)}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (type === 'voice') {
    return (
      <div className={cn('flex w-full', isFromMe ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[88%] rounded-card px-3.5 py-2.5 text-base flex flex-col gap-2 md:max-w-[75%] md:px-3 md:py-2 md:text-sm',
            isFromMe ? 'bg-primary-accent text-primary-dark' : 'bg-[var(--color-border)] text-[var(--color-text)]'
          )}
        >
          {replyBlock}
          <audio controls src={message.attachmentUrl} className="max-w-full h-9" preload="metadata" />
          {isFromMe ? (
            <OutgoingStatusFooter
              createdAt={message.createdAt}
              editedAt={message.editedAt}
              read={message.read}
              mutedClass="text-primary-dark/70"
            />
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">
              {formatChatMessageTime(message.createdAt) || formatDateTime(message.createdAt)}
              {message.editedAt && ' · Edited'}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex w-full', isFromMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-card px-3.5 py-2.5 text-base md:max-w-[75%] md:px-3 md:py-2 md:text-sm',
          isFromMe ? 'bg-primary-accent text-primary-dark' : 'bg-[var(--color-border)] text-[var(--color-text)]'
        )}
      >
        {replyBlock}
        {isAdminMessage ? <p className="mb-1 text-xs font-semibold text-[var(--color-text-muted)]">{adminLabel}</p> : null}
        <p className="whitespace-pre-wrap break-words">{displayText}</p>
        <AttachmentLink message={message} isFromMe={isFromMe} />
        {isFromMe ? (
          <OutgoingStatusFooter
            createdAt={message.createdAt}
            editedAt={message.editedAt}
            read={message.read}
            mutedClass="text-primary-dark/70"
          />
        ) : (
          <p className="text-xs mt-1 text-[var(--color-text-muted)]">
            {formatChatMessageTime(message.createdAt) || formatDateTime(message.createdAt)}
            {message.editedAt && ' · Edited'}
          </p>
        )}
      </div>
    </div>
  )
}
