import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/Button'
import { uploadFile } from '@/services/upload'
import type { Chat, Message } from '@/types/chat'
import type { SendMessageParams } from '@/services/chat'
import { Mic, Square, Smile, Send, GraduationCap } from 'lucide-react'

const EMOTION_OPTIONS = ['👍', '👏', '🎉', '❤️', '😊', '🙏', '⭐', '🔥', '💪', '👋']

interface MessageThreadProps {
  chat: Chat | null
  messages: Message[]
  loading?: boolean
  onSend: (params: string | SendMessageParams) => void
  onMarkRead?: () => void
  isTyping?: boolean
  role?: 'student' | 'university'
  onAcceptStudent?: (params: { positionType: 'budget' | 'grant' | 'other'; positionLabel?: string; congratulatoryMessage: string }) => void | Promise<unknown>
}

export function MessageThread({
  chat,
  messages,
  loading,
  onSend,
  onMarkRead,
  isTyping,
  role,
  onAcceptStudent,
}: MessageThreadProps) {
  const { t } = useTranslation(['common', 'chat'])
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [emotionOpen, setEmotionOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [acceptSending, setAcceptSending] = useState(false)
  const [acceptForm, setAcceptForm] = useState({ positionType: 'budget' as 'budget' | 'grant' | 'other', positionLabel: '', congratulatoryMessage: '' })

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

  const handleSendEmotion = (emoji: string) => {
    if (!chat) return
    onSend({ type: 'emotion', metadata: { emotion: emoji } })
    setEmotionOpen(false)
  }

  const startRecording = () => {
    if (!chat || !navigator.mediaDevices?.getUserMedia) return
    chunksRef.current = []
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' })
        uploadFile(file).then((url) => {
          onSend({ type: 'voice', attachmentUrl: url })
        }).catch(() => {})
      }
      mr.start()
      setRecording(true)
    }).catch(() => {})
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  const handleAcceptSubmit = async () => {
    if (!onAcceptStudent || !chat) return
    setAcceptSending(true)
    try {
      const p = onAcceptStudent({
        positionType: acceptForm.positionType,
        positionLabel: acceptForm.positionLabel.trim() || undefined,
        congratulatoryMessage: acceptForm.congratulatoryMessage.trim() || t('chat:acceptDefaultMessage'),
      })
      await (p && typeof (p as Promise<unknown>).then === 'function' ? p : Promise.resolve())
      setAcceptModalOpen(false)
      setAcceptForm({ positionType: 'budget', positionLabel: '', congratulatoryMessage: '' })
    } finally {
      setAcceptSending(false)
    }
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg)]">
        {t('common:selectConversation')}
      </div>
    )
  }

  const showAcceptButton = role === 'university' && !chat.acceptedAt && onAcceptStudent

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg)]">
      <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="font-medium">{chat.participant.name}</p>
          {chat.acceptedAt && (
            <p className="text-xs text-primary-accent font-medium mt-0.5">
              {t('chat:accepted')}: {chat.acceptancePositionLabel || chat.acceptancePositionType || '—'}
            </p>
          )}
        </div>
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
              {t('common:typing')}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="flex gap-2 items-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setEmotionOpen((v) => !v)}
              className="p-2 rounded-input hover:bg-[var(--color-border)]/30 text-[var(--color-text-muted)]"
              aria-label={t('chat:emotions')}
            >
              <Smile className="w-5 h-5" />
            </button>
            {emotionOpen && (
              <div className="absolute bottom-full left-0 mb-1 p-2 rounded-card bg-[var(--color-card)] border border-[var(--color-border)] shadow-lg flex flex-wrap gap-1 max-w-[200px]">
                {EMOTION_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendEmotion(emoji)}
                    className="text-2xl p-1 hover:bg-[var(--color-border)]/30 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {recording ? (
            <Button type="button" variant="secondary" size="sm" onClick={stopRecording} icon={<Square className="w-4 h-4" />}>
              {t('chat:stopRecording')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startRecording}
              icon={<Mic className="w-5 h-5" />}
              aria-label={t('chat:voiceMessage')}
              title={t('chat:voiceMessage')}
            >
              <span className="sr-only">{t('chat:voiceMessage')}</span>
            </Button>
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder={t('common:typeMessage')}
            className="flex-1 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            disabled={loading}
          />
          <Button type="submit" size="sm" icon={<Send className="w-4 h-4" />}>
            {t('common:send')}
          </Button>
        </div>
      </form>

      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setAcceptModalOpen(false)}>
          <div
            className="bg-[var(--color-card)] rounded-card shadow-xl max-w-md w-full p-6 border border-[var(--color-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">{t('chat:acceptStudent')}</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">{t('chat:acceptHint')}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('chat:positionType')}</label>
                <select
                  value={acceptForm.positionType}
                  onChange={(e) => setAcceptForm((f) => ({ ...f, positionType: e.target.value as 'budget' | 'grant' | 'other' }))}
                  className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                >
                  <option value="budget">{t('chat:positionBudget')}</option>
                  <option value="grant">{t('chat:positionGrant')}</option>
                  <option value="other">{t('chat:positionOther')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('chat:positionLabel')}</label>
                <input
                  type="text"
                  value={acceptForm.positionLabel}
                  onChange={(e) => setAcceptForm((f) => ({ ...f, positionLabel: e.target.value }))}
                  placeholder={t('chat:positionLabelPlaceholder')}
                  className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('chat:congratulatoryMessage')}</label>
                <textarea
                  value={acceptForm.congratulatoryMessage}
                  onChange={(e) => setAcceptForm((f) => ({ ...f, congratulatoryMessage: e.target.value }))}
                  placeholder={t('chat:congratulatoryPlaceholder')}
                  rows={3}
                  className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" onClick={() => setAcceptModalOpen(false)}>
                {t('common:cancel')}
              </Button>
              <Button onClick={handleAcceptSubmit} disabled={acceptSending} loading={acceptSending}>
                {t('chat:accept')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
