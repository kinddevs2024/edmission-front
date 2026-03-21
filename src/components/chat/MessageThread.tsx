import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { SendDocumentModal } from '@/components/documents/SendDocumentModal'
import { uploadFile } from '@/services/upload'
import { toastApiError } from '@/utils/toastError'
import { cn } from '@/utils/cn'
import type { Chat, Message } from '@/types/chat'
import type { SendMessageParams } from '@/services/chat'
import {
  Mic,
  Square,
  Smile,
  Send,
  GraduationCap,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Copy,
  Reply,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

const EMOTION_OPTIONS = ['\u{1F44D}', '\u{1F44F}', '\u{1F389}', '\u{2764}\u{FE0F}', '\u{1F60A}', '\u{1F64F}', '\u{2B50}', '\u{1F525}', '\u{1F4AA}', '\u{1F44B}']
const DEFAULT_WAVE_LEVELS = Array.from({ length: 24 }, (_, index) => 0.18 + ((index % 5) * 0.05))

interface MessageThreadProps {
  chat: Chat | null
  messages: Message[]
  loading?: boolean
  onSend: (params: string | SendMessageParams) => void | Promise<unknown>
  onUpdateMessage?: (messageId: string, text: string) => void | Promise<unknown>
  onDeleteMessage?: (messageId: string, scope: 'me' | 'everyone') => void | Promise<unknown>
  onMarkRead?: () => void
  isTyping?: boolean
  role?: 'student' | 'university'
  onAcceptStudent?: (params: { positionType: 'budget' | 'grant' | 'other'; positionLabel?: string; congratulatoryMessage: string }) => void | Promise<unknown>
}

type VoiceDraft = {
  file: File
  url: string
  durationMs: number
  levels: number[]
}

function formatVoiceDuration(durationMs: number) {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function VoiceWaveform({ levels, active = false }: { levels: number[]; active?: boolean }) {
  return (
    <div className="flex h-12 items-end gap-1">
      {levels.map((level, index) => (
        <span
          key={`${index}-${level}`}
          className={cn(
            'w-1.5 rounded-full bg-primary-accent/85 transition-all duration-150',
            active && 'shadow-[0_0_14px_rgba(132,229,0,0.35)]'
          )}
          style={{ height: `${Math.max(8, Math.min(42, Math.round(level * 46)))}px` }}
        />
      ))}
    </div>
  )
}

export function MessageThread({
  chat,
  messages,
  loading,
  onSend,
  onUpdateMessage,
  onDeleteMessage,
  onMarkRead,
  isTyping,
  role,
  onAcceptStudent,
}: MessageThreadProps) {
  const { t } = useTranslation(['common', 'chat'])
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const durationTimerRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef<number | null>(null)
  const waveformSnapshotRef = useRef<number[]>(DEFAULT_WAVE_LEVELS)

  const [composerText, setComposerText] = useState('')
  const [emotionOpen, setEmotionOpen] = useState(false)
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing' | 'review'>('idle')
  const [recordingDurationMs, setRecordingDurationMs] = useState(0)
  const [waveLevels, setWaveLevels] = useState<number[]>(DEFAULT_WAVE_LEVELS)
  const [voiceDraft, setVoiceDraft] = useState<VoiceDraft | null>(null)
  const [voiceSending, setVoiceSending] = useState(false)
  const [messageSaving, setMessageSaving] = useState(false)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [acceptSending, setAcceptSending] = useState(false)
  const [acceptForm, setAcceptForm] = useState({ positionType: 'budget' as 'budget' | 'grant' | 'other', positionLabel: '', congratulatoryMessage: '' })
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{ message: Message; top: number; left: number } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [sendDocumentOpen, setSendDocumentOpen] = useState(false)
  const [isCompactViewport, setIsCompactViewport] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (chat?.id && onMarkRead) onMarkRead()
  }, [chat?.id, onMarkRead])

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null)
      setEmotionOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null)
        setEmotionOpen(false)
        if (editingMessage) {
          setEditingMessage(null)
          setComposerText('')
        }
      }
    }

    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [editingMessage])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
      if (durationTimerRef.current) window.clearInterval(durationTimerRef.current)
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      audioContextRef.current?.close().catch(() => {})
      if (voiceDraft?.url) URL.revokeObjectURL(voiceDraft.url)
    }
  }, [voiceDraft?.url])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateViewportMode = () => setIsCompactViewport(window.innerWidth < 768)
    updateViewportMode()
    window.addEventListener('resize', updateViewportMode)
    return () => window.removeEventListener('resize', updateViewportMode)
  }, [])

  const clearRecordingHelpers = () => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }

  const resetVoiceDraft = () => {
    if (voiceDraft?.url) URL.revokeObjectURL(voiceDraft.url)
    setVoiceDraft(null)
    setWaveLevels(DEFAULT_WAVE_LEVELS)
    waveformSnapshotRef.current = DEFAULT_WAVE_LEVELS
    setRecordingDurationMs(0)
    setRecordingState('idle')
  }

  useEffect(() => {
    if (!chat?.isReadOnly) return

    setEmotionOpen(false)
    setContextMenu(null)
    setDeleteTarget(null)
    setReplyTo(null)
    setEditingMessage(null)
    setComposerText('')
    chunksRef.current = []
    mediaRecorderRef.current = null
    clearRecordingHelpers()
    resetVoiceDraft()
  }, [chat?.id, chat?.isReadOnly])

  const openContextMenu = (message: Message, anchorEl: HTMLElement) => {
    if (isCompactViewport) {
      setContextMenu({ message, top: 0, left: 0 })
      return
    }

    const container = messageListRef.current
    if (!container) return

    const anchorRect = anchorEl.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const menuWidth = 208
    const menuHeight = 180
    const leftBase = message.isFromMe
      ? anchorRect.right - containerRect.left + container.scrollLeft - menuWidth
      : anchorRect.left - containerRect.left + container.scrollLeft
    const topBase = anchorRect.top - containerRect.top + container.scrollTop + anchorRect.height + 8

    setContextMenu({
      message,
      top: Math.max(12, Math.min(topBase, container.scrollTop + container.clientHeight - menuHeight)),
      left: Math.max(12, Math.min(leftBase, container.clientWidth - menuWidth - 12)),
    })
  }

  const buildReplyMetadata = () => (
    replyTo
      ? {
          replyToMessageId: replyTo.id,
          replyToPreview:
            replyTo.type === 'voice'
              ? 'Voice message'
              : replyTo.type === 'emotion'
                ? String(replyTo.metadata?.emotion ?? replyTo.text ?? 'Reaction')
                : replyTo.text,
        }
      : undefined
  )

  const getMessagePreviewText = (message: Message | null) => {
    if (!message) return ''
    if (message.type === 'voice') return 'Voice message'
    if (message.type === 'emotion') return String(message.metadata?.emotion ?? message.text ?? 'Reaction')
    return message.text ?? ''
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!chat || chat.isReadOnly || recordingState !== 'idle') return

    const text = composerText.trim()
    if (!text) return

    setMessageSaving(true)
    try {
      if (editingMessage && onUpdateMessage) {
        await Promise.resolve(onUpdateMessage(editingMessage.id, text))
        setEditingMessage(null)
      } else {
        const base: SendMessageParams = { text }
        const replyMetadata = buildReplyMetadata()
        if (replyMetadata) {
          base.metadata = replyMetadata
        }
        await Promise.resolve(onSend(base))
        setReplyTo(null)
      }
      setComposerText('')
    } catch (error) {
      toastApiError(error)
    } finally {
      setMessageSaving(false)
    }
  }

  const handleSendEmotion = async (emoji: string) => {
    if (!chat || chat.isReadOnly) return

    try {
      await Promise.resolve(onSend({
        type: 'emotion',
        metadata: {
          emotion: emoji,
          ...(buildReplyMetadata() ?? {}),
        },
      }))
      setEmotionOpen(false)
      setReplyTo(null)
    } catch (error) {
      toastApiError(error)
    }
  }

  const startRecording = async () => {
    if (!chat || chat.isReadOnly || !navigator.mediaDevices?.getUserMedia) return
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (typeof MediaRecorder === 'undefined' || !AudioContextCtor) {
      toastApiError(new Error('Voice recording is not supported in this browser'))
      return
    }

    try {
      resetVoiceDraft()
      chunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const audioContext = new AudioContextCtor()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      const frequencyData = new Uint8Array(analyser.frequencyBinCount)

      const updateWaveform = () => {
        analyser.getByteFrequencyData(frequencyData)
        const bars = 24
        const bucketSize = Math.max(1, Math.floor(frequencyData.length / bars))
        const nextLevels = Array.from({ length: bars }, (_, index) => {
          const start = index * bucketSize
          const slice = frequencyData.slice(start, start + bucketSize)
          const avg = slice.length > 0 ? slice.reduce((sum, value) => sum + value, 0) / slice.length : 0
          return Math.max(0.12, avg / 255)
        })
        waveformSnapshotRef.current = nextLevels
        setWaveLevels(nextLevels)
        animationFrameRef.current = window.requestAnimationFrame(updateWaveform)
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      recordingStartedAtRef.current = Date.now()
      setRecordingDurationMs(0)
      setRecordingState('recording')
      setWaveLevels(DEFAULT_WAVE_LEVELS)

      durationTimerRef.current = window.setInterval(() => {
        if (recordingStartedAtRef.current) {
          setRecordingDurationMs(Date.now() - recordingStartedAtRef.current)
        }
      }, 200)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        clearRecordingHelpers()

        if (chunksRef.current.length === 0) {
          resetVoiceDraft()
          toastApiError(new Error('Recording too short. Try again.'))
          return
        }

        const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm'
        const extension = actualMimeType.includes('mp4') ? '.m4a' : '.webm'
        const durationMs = recordingStartedAtRef.current ? Date.now() - recordingStartedAtRef.current : recordingDurationMs
        const blob = new Blob(chunksRef.current, { type: actualMimeType })
        const file = new File([blob], `voice${extension}`, { type: actualMimeType })
        const url = URL.createObjectURL(blob)

        setVoiceDraft({
          file,
          url,
          durationMs,
          levels: waveformSnapshotRef.current,
        })
        setWaveLevels(waveformSnapshotRef.current)
        setRecordingDurationMs(durationMs)
        setRecordingState('review')
      }

      mediaRecorder.start()
      updateWaveform()
    } catch (error) {
      clearRecordingHelpers()
      resetVoiceDraft()
      toastApiError(error)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return
    setRecordingState('processing')
    mediaRecorderRef.current.stop()
  }

  const sendVoiceDraft = async () => {
    if (!voiceDraft || chat?.isReadOnly) return
    setVoiceSending(true)
    try {
      const attachmentUrl = await uploadFile(voiceDraft.file)
      const replyMetadata = buildReplyMetadata()
      await Promise.resolve(onSend({
        type: 'voice',
        attachmentUrl,
        ...(replyMetadata ? { metadata: replyMetadata } : {}),
      }))
      setReplyTo(null)
      resetVoiceDraft()
    } catch (error) {
      toastApiError(error)
    } finally {
      setVoiceSending(false)
    }
  }

  const handleAcceptSubmit = async () => {
    if (!onAcceptStudent || !chat) return
    setAcceptSending(true)
    try {
      const promise = onAcceptStudent({
        positionType: acceptForm.positionType,
        positionLabel: acceptForm.positionLabel.trim() || undefined,
        congratulatoryMessage: acceptForm.congratulatoryMessage.trim() || t('chat:acceptDefaultMessage'),
      })
      await Promise.resolve(promise)
      setAcceptModalOpen(false)
      setAcceptForm({ positionType: 'budget', positionLabel: '', congratulatoryMessage: '' })
    } finally {
      setAcceptSending(false)
    }
  }

  const beginEdit = (message: Message) => {
    if (isReadOnly) return
    setContextMenu(null)
    setReplyTo(null)
    setEditingMessage(message)
    setComposerText(message.text ?? '')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const beginReply = (message: Message) => {
    if (isReadOnly) return
    setContextMenu(null)
    setEditingMessage(null)
    setReplyTo(message)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const confirmDelete = (message: Message) => {
    if (isReadOnly) return
    setContextMenu(null)
    setDeleteTarget(message)
  }

  const handleDelete = async (scope: 'me' | 'everyone') => {
    if (!deleteTarget || !onDeleteMessage) return
    setDeleteBusy(true)
    try {
      await Promise.resolve(onDeleteMessage(deleteTarget.id, scope))
      if (editingMessage?.id === deleteTarget.id) {
        setEditingMessage(null)
        setComposerText('')
      }
      if (replyTo?.id === deleteTarget.id) {
        setReplyTo(null)
      }
      setDeleteTarget(null)
    } catch (error) {
      toastApiError(error)
    } finally {
      setDeleteBusy(false)
    }
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-card)]">
        {t('common:selectConversation')}
      </div>
    )
  }

  const isReadOnly = !!chat.isReadOnly
  const readOnlyNotice =
    chat.readOnlyReason === 'rejected'
      ? t('chat:readOnlyRejected', 'This university closed the chat after rejecting your application. You can still read the conversation, but you can no longer send messages.')
      : t('chat:readOnlyGeneric', 'This chat is read-only. You can still view the conversation, but you cannot send new messages.')
  const acceptPositionOptions = [
    { value: 'budget', label: t('chat:positionBudget') },
    { value: 'grant', label: t('chat:positionGrant') },
    { value: 'other', label: t('chat:positionOther') },
  ]
  const showAcceptButton = role === 'university' && !chat.acceptedAt && onAcceptStudent
  const profileUrl = role === 'student'
    ? `/student/universities/${chat.participant.id}`
    : role === 'university'
      ? `/university/students/${chat.participant.id}`
      : null
  const menuMessage = contextMenu?.message
  const canReply = !isReadOnly && menuMessage && menuMessage.type !== 'system'
  const canCopy = !!menuMessage?.text
  const canEdit = !isReadOnly && !!menuMessage?.isFromMe && menuMessage?.type === 'text'
  const canDelete = !isReadOnly
  const canDeleteForEveryone = canDelete && !!deleteTarget?.isFromMe && deleteTarget.type !== 'system'
  const composerMode = editingMessage ? 'edit' : replyTo ? 'reply' : null
  const menuPreviewText = getMessagePreviewText(menuMessage ?? null)
  const canOpenContextMenu = (message: Message) => {
    if (message.type === 'system') return false
    if (isReadOnly) return !!(message.text ?? '').trim()
    return true
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--color-card)]">
      <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="font-medium">{chat.participant.name}</p>
          {chat.acceptedAt && (
            <p className="text-xs text-primary-accent font-medium mt-0.5">
              {t('chat:accepted')}: {chat.acceptancePositionLabel || chat.acceptancePositionType || '—'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profileUrl && (
            <Link
              to={profileUrl}
              className="inline-flex items-center gap-1.5 rounded-input px-2 py-1.5 text-sm font-medium text-primary-accent hover:bg-primary-accent/10 transition-colors"
              title={t('chat:openProfile', 'Open profile')}
            >
              <ExternalLink className="w-4 h-4" aria-hidden />
              <span>{t('chat:openProfile', 'Open profile')}</span>
            </Link>
          )}
          {showAcceptButton && (
            <Button
              size="sm"
              onClick={() => setAcceptModalOpen(true)}
              icon={<GraduationCap className="w-4 h-4" />}
              title={t('chat:acceptTooltip')}
            >
              {t('chat:accept')}
            </Button>
          )}
          {role === 'university' ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSendDocumentOpen(true)}
              icon={<FileText className="w-4 h-4" />}
            >
              Send document
            </Button>
          ) : null}
        </div>
      </div>

      <div ref={messageListRef} className="relative flex-1 overflow-y-auto bg-[var(--color-bg)] p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-12 rounded-card bg-[var(--color-border)] animate-pulse max-w-[75%]" />
            ))}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="group relative"
              onContextMenu={(event) => {
                if (!canOpenContextMenu(message)) return
                event.preventDefault()
                openContextMenu(message, event.currentTarget)
              }}
            >
              {canOpenContextMenu(message) ? (
                <button
                  type="button"
                  className={cn(
                    'absolute top-2 z-10 h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/95 text-[var(--color-text-muted)] shadow-md transition hover:text-[var(--color-text)]',
                    isCompactViewport ? 'flex' : 'hidden group-hover:flex',
                    message.isFromMe ? 'right-2' : 'left-2'
                  )}
                  onClick={(event) => {
                    event.stopPropagation()
                    openContextMenu(message, event.currentTarget.parentElement as HTMLElement)
                  }}
                  aria-label={t('chat:messageActions', 'Message actions')}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              ) : null}
              <MessageBubble message={message} />
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-card px-3 py-2 bg-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
              {t('common:typing')}
            </div>
          </div>
        )}
        <div ref={bottomRef} />

        {contextMenu && !isCompactViewport ? (
          <div
            className="absolute z-20 min-w-[208px] rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl overflow-hidden"
            style={{ top: contextMenu.top, left: contextMenu.left }}
            onClick={(event) => event.stopPropagation()}
          >
            {canReply ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-border)]/20"
                onClick={() => beginReply(contextMenu.message)}
              >
                <Reply className="h-4 w-4" />
                <span>{t('chat:reply', 'Reply')}</span>
              </button>
            ) : null}
            {canCopy ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-border)]/20"
                onClick={() => {
                  navigator.clipboard?.writeText(contextMenu.message.text ?? '').catch(() => {})
                  setContextMenu(null)
                }}
              >
                <Copy className="h-4 w-4" />
                <span>{t('chat:copy', 'Copy')}</span>
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-border)]/20"
                onClick={() => beginEdit(contextMenu.message)}
              >
                <Pencil className="h-4 w-4" />
                <span>{t('chat:edit', 'Edit')}</span>
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-500/10"
                onClick={() => confirmDelete(contextMenu.message)}
              >
                <Trash2 className="h-4 w-4" />
                <span>{t('chat:delete', 'Delete')}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {contextMenu && isCompactViewport ? (
        <div className="fixed inset-0 z-30 bg-black/45 md:hidden" onClick={() => setContextMenu(null)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-[var(--color-border)] bg-[var(--color-card)] px-4 pb-6 pt-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--color-border)]" />
            <div className="mb-4 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Selected message
              </p>
              <div className="max-h-[30vh] overflow-y-auto text-sm text-[var(--color-text)] whitespace-pre-wrap break-words">
                {menuMessage?.type === 'voice'
                  ? 'Voice message'
                  : menuMessage?.type === 'emotion'
                    ? menuPreviewText
                    : menuPreviewText || 'Empty message'}
              </div>
            </div>

            <div className="space-y-2">
              {canReply ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium hover:bg-[var(--color-border)]/20"
                  onClick={() => beginReply(contextMenu.message)}
                >
                  <Reply className="h-4 w-4" />
                  <span>{t('chat:reply', 'Reply')}</span>
                </button>
              ) : null}
              {canCopy ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium hover:bg-[var(--color-border)]/20"
                  onClick={() => {
                    navigator.clipboard?.writeText(contextMenu.message.text ?? '').catch(() => {})
                    setContextMenu(null)
                  }}
                >
                  <Copy className="h-4 w-4" />
                  <span>{t('chat:copy', 'Copy')}</span>
                </button>
              ) : null}
              {canEdit ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium hover:bg-[var(--color-border)]/20"
                  onClick={() => beginEdit(contextMenu.message)}
                >
                  <Pencil className="h-4 w-4" />
                  <span>{t('chat:edit', 'Edit')}</span>
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-500/10"
                  onClick={() => confirmDelete(contextMenu.message)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{t('chat:delete', 'Delete')}</span>
                </button>
              ) : null}
              <Button variant="ghost" className="w-full" onClick={() => setContextMenu(null)}>
                {t('common:cancel')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--color-border)] bg-[var(--color-card)] shrink-0">
        {composerMode && (
          <div className="mb-2 flex items-center justify-between rounded-card bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
            <div className="truncate">
              <span className="font-medium mr-1">
                {editingMessage ? t('chat:editing', 'Editing message') : t('chat:replyingTo', 'Replying to')}:
              </span>
              <span className="truncate">{editingMessage ? getMessagePreviewText(editingMessage) : getMessagePreviewText(replyTo)}</span>
            </div>
            <button
              type="button"
              className="ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              onClick={() => {
                setEditingMessage(null)
                setReplyTo(null)
                if (editingMessage) setComposerText('')
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isReadOnly ? (
          <div className="rounded-[22px] border border-rose-500/25 bg-rose-500/8 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {t('chat:chatClosedTitle', 'Chat closed')}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {readOnlyNotice}
            </p>
          </div>
        ) : (
          <div className="relative flex gap-2 items-center w-full rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 focus-within:border-primary-accent focus-within:ring-2 focus-within:ring-primary-accent focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-card)] transition-all duration-200">
            <div className="relative flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setEmotionOpen((open) => !open)
                }}
                className="p-2 rounded-full hover:bg-[var(--color-border)]/30 text-[var(--color-text-muted)] transition-colors"
                aria-label={t('chat:emotions')}
                disabled={recordingState !== 'idle'}
              >
                <Smile className="w-5 h-5" />
              </button>
              {emotionOpen && (
                <div className="absolute bottom-full left-0 mb-1 p-2 rounded-card bg-[var(--color-card)] border border-[var(--color-border)] shadow-lg flex flex-wrap gap-1 max-w-[200px] z-10">
                  {EMOTION_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendEmotion(emoji)}
                      className="text-2xl p-1 hover:bg-[var(--color-border)]/30 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {recordingState === 'idle' ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="!p-2 !min-w-0 rounded-full"
                  onClick={startRecording}
                  icon={<Mic className="w-5 h-5" />}
                  aria-label={t('chat:voiceMessage')}
                  title={t('chat:voiceMessage')}
                  disabled={loading || messageSaving}
                >
                  <span className="sr-only">{t('chat:voiceMessage')}</span>
                </Button>
                <input
                  ref={inputRef}
                  type="text"
                  value={composerText}
                  onChange={(event) => setComposerText(event.target.value)}
                  placeholder={editingMessage ? t('chat:editPlaceholder', 'Edit your message') : t('common:typeMessage')}
                  className="flex-1 min-w-0 bg-transparent px-1 py-1.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none"
                  disabled={loading || messageSaving}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="shrink-0 w-10 h-10 min-w-10 min-h-10 rounded-full p-0 flex items-center justify-center"
                  icon={<Send className="w-5 h-5" />}
                  aria-label={editingMessage ? t('chat:saveEdit', 'Save') : t('common:send')}
                  loading={messageSaving}
                  disabled={!composerText.trim()}
                >
                  <span className="sr-only">{editingMessage ? t('chat:saveEdit', 'Save') : t('common:send')}</span>
                </Button>
              </>
            ) : (
              <div className="flex flex-1 items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-muted)] mb-2">
                    <span>
                      {recordingState === 'recording'
                        ? t('chat:recordingNow', 'Recording...')
                        : recordingState === 'processing'
                          ? t('chat:processingVoice', 'Preparing voice message...')
                          : t('chat:voiceReady', 'Voice message ready')}
                    </span>
                    <span>{formatVoiceDuration(recordingDurationMs)}</span>
                  </div>
                  <VoiceWaveform levels={voiceDraft?.levels ?? waveLevels} active={recordingState === 'recording'} />
                </div>

                {recordingState === 'recording' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={stopRecording}
                    icon={<Square className="w-4 h-4" />}
                  >
                    {t('chat:stopRecording')}
                  </Button>
                ) : recordingState === 'review' ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-500/40"
                      onClick={resetVoiceDraft}
                      aria-label={t('common:cancel')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 w-10 h-10 min-w-10 min-h-10 rounded-full p-0 flex items-center justify-center"
                      icon={<Send className="w-5 h-5" />}
                      onClick={sendVoiceDraft}
                      loading={voiceSending}
                      disabled={!voiceDraft}
                      aria-label={t('common:send')}
                    >
                      <span className="sr-only">{t('common:send')}</span>
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </form>

      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleteBusy) setDeleteTarget(null)
        }}
        title={t('chat:deleteMessageTitle', 'Delete message')}
        panelClassName="max-w-sm"
        contentClassName="space-y-4"
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          {canDeleteForEveryone
            ? t('chat:deleteMessageHintAll', 'Choose whether to remove the message only for yourself or for everyone in this chat.')
            : t('chat:deleteMessageHintMine', 'This message will be removed only from your chat history.')}
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => handleDelete('me')} loading={deleteBusy}>
            {t('chat:deleteForMe', 'Delete for me')}
          </Button>
          {canDeleteForEveryone ? (
            <Button variant="danger" onClick={() => handleDelete('everyone')} loading={deleteBusy}>
              {t('chat:deleteForEveryone', 'Delete for everyone')}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>
            {t('common:cancel')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={acceptModalOpen}
        onClose={() => {
          if (!acceptSending) setAcceptModalOpen(false)
        }}
        title={t('chat:acceptStudent')}
        panelClassName="max-w-md"
        contentClassName="space-y-3"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAcceptModalOpen(false)} disabled={acceptSending}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleAcceptSubmit} disabled={acceptSending} loading={acceptSending}>
              {t('chat:accept')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-text-muted)]">{t('chat:acceptHint')}</p>
        <Select
          label={t('chat:positionType')}
          value={acceptForm.positionType}
          onChange={(event) => setAcceptForm((form) => ({ ...form, positionType: event.target.value as 'budget' | 'grant' | 'other' }))}
          options={acceptPositionOptions}
        />
        <div>
          <label className="block text-sm font-medium mb-1">{t('chat:positionLabel')}</label>
          <input
            type="text"
            value={acceptForm.positionLabel}
            onChange={(event) => setAcceptForm((form) => ({ ...form, positionLabel: event.target.value }))}
            placeholder={t('chat:positionLabelPlaceholder')}
            className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          />
        </div>
        <Textarea
          label={t('chat:congratulatoryMessage')}
          value={acceptForm.congratulatoryMessage}
          onChange={(event) => setAcceptForm((form) => ({ ...form, congratulatoryMessage: event.target.value }))}
          placeholder={t('chat:congratulatoryPlaceholder')}
          rows={3}
        />
      </Modal>

      {role === 'university' ? (
        <SendDocumentModal
          open={sendDocumentOpen}
          studentId={chat.participant.id}
          chatId={chat.id}
          studentName={chat.participant.name}
          onClose={() => setSendDocumentOpen(false)}
        />
      ) : null}
    </div>
  )
}
