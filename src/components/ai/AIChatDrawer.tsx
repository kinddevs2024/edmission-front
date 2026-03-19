import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Maximize2, Bot, User } from 'lucide-react'
import { MessageTextWithLinks } from '@/utils/linkifyPaths'
import { sendAIChatStream, getAIStatus, type AIStatus } from '@/services/ai'
import { updateStudentProfile } from '@/services/student'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { useAIChatStore, type ChatMessage } from '@/store/aiChatStore'
import { parseAIActions } from '@/utils/parseAIActions'

const FALLBACK_PLACEHOLDERS = ['Type your question…', 'What would you like to ask?', 'How can I help?']
const FALLBACK_SUGGESTED = [
  'How to choose a university?',
  'What documents are needed?',
  'How do scholarships work?',
  'Where do I enter my GPA?',
  'Help me with my profile',
]

interface AIChatDrawerProps {
  open: boolean
  onClose: () => void
}

export function AIChatDrawer({ open, onClose }: AIChatDrawerProps) {
  const { t } = useTranslation('common')
  const suggestedQuestions = (t('aiSuggestedQuestions', { returnObjects: true }) as string[] | undefined) ?? FALLBACK_SUGGESTED
  const placeholdersRaw = t('aiPlaceholders', { returnObjects: true })
  const placeholders = Array.isArray(placeholdersRaw) ? (placeholdersRaw as string[]) : FALLBACK_PLACEHOLDERS
  const [placeholderIndex, setPlaceholderIndex] = useState(() => Math.floor(Math.random() * Math.max(1, placeholders.length)))
  const placeholder = placeholders[placeholderIndex % placeholders.length]
  const { role, user } = useAuth()
  const navigate = useNavigate()
  const messages = useAIChatStore((s) => s.messages)
  const addMessage = useAIChatStore((s) => s.addMessage)
  const updateMessage = useAIChatStore((s) => s.updateMessage)
  const removeMessage = useAIChatStore((s) => s.removeMessage)
  const selectionAsk = useAIChatStore((s) => s.selectionAsk)
  const setSelectionAsk = useAIChatStore((s) => s.setSelectionAsk)
  const sessionId = useAIChatStore((s) => s.sessionId)
  const requestLimit = useAIChatStore((s) => s.requestLimit)
  const requestsUsed = useAIChatStore((s) => s.requestsUsed)
  const incrementRequestsUsed = useAIChatStore((s) => s.incrementRequestsUsed)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null)
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      getAIStatus()
        .then(setAIStatus)
        .catch(() => setAIStatus({ ok: false, model: '' }))
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = useCallback(
    async (text: string, selectedText?: string) => {
      const trimmed = text.trim() || (selectedText ? t('aiExplainSelection', 'Please explain or elaborate on the selected part.') : '')
      if (!trimmed || loading) return
      if (requestsUsed >= requestLimit) {
        setRateLimitMessage(t('aiQuestionLimitReached', { limit: requestLimit, defaultValue: 'Question limit reached ({{limit}}). Refresh the page to reset it.' }))
        return
      }

      setInput('')
      setPlaceholderIndex((i) => (i + 1 + Math.floor(Math.random() * Math.max(1, placeholders.length - 1))) % Math.max(1, placeholders.length))
      setError(null)
      setRateLimitMessage(null)
      setSelectionAsk(null)

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed }
      addMessage(userMsg)
      setLoading(true)
      incrementRequestsUsed()

      const assistantId = `a-${Date.now()}`
      const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', text: '', thinking: '' }
      addMessage(assistantMsg)

      const historyForApi: { role: 'user' | 'assistant'; content: string }[] = [
        ...messages.slice(-19).map((m) => ({ role: m.role, content: m.text })),
        { role: 'user', content: trimmed },
      ]

      try {
        await sendAIChatStream(
          { message: trimmed, history: historyForApi, selectedText, sessionId },
          {
            onChunk: (chunk) => {
              updateMessage(assistantId, (m) => {
                if (chunk.type === 'thinking') {
                  return { ...m, thinking: (m.thinking ?? '') + chunk.text }
                }
                return { ...m, text: (m.text ?? '') + chunk.text }
              })
            },
            onDone: () => {
              setLoading(false)
              const last = useAIChatStore.getState().messages.find((m) => m.id === assistantId)
              const fullText = last?.text ?? ''
              const { displayText, profileUpdate, openPath } = parseAIActions(fullText)
              if (displayText !== fullText) {
                updateMessage(assistantId, (m) => ({ ...m, text: displayText }))
              }
              if (openPath) navigate(openPath)
              if (profileUpdate && role === 'student' && user?.id) {
                const patch: Record<string, unknown> = {}
                if (profileUpdate.firstName != null) patch.firstName = String(profileUpdate.firstName)
                if (profileUpdate.lastName != null) patch.lastName = String(profileUpdate.lastName)
                if (profileUpdate.country != null) patch.country = String(profileUpdate.country)
                if (profileUpdate.city != null) patch.city = String(profileUpdate.city)
                if (profileUpdate.birthDate != null) patch.birthDate = String(profileUpdate.birthDate)
                if (profileUpdate.age != null) {
                  const age = Number(profileUpdate.age)
                  if (!isNaN(age)) {
                    const y = new Date().getFullYear()
                    patch.birthDate = `${y - age}-01-01`
                  }
                }
                if (Array.isArray(profileUpdate.interests)) patch.interests = profileUpdate.interests.map(String)
                if (Array.isArray(profileUpdate.skills)) patch.skills = profileUpdate.skills.map(String)
                if (Array.isArray(profileUpdate.hobbies)) patch.hobbies = profileUpdate.hobbies.map(String)
                if (Object.keys(patch).length > 0) {
                  updateStudentProfile(patch).catch(() => {})
                }
              }
            },
            onError: (message) => {
              setLoading(false)
              if (message.toLowerCase().includes('limit') || message.includes('429')) {
                setRateLimitMessage(message)
              } else {
                setError(message)
              }
              removeMessage(assistantId)
            },
          }
        )
      } catch (err: unknown) {
        setLoading(false)
        removeMessage(assistantId)
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null
        if (
          msg?.toLowerCase().includes('limit') ||
          (err as { response?: { status?: number } }).response?.status === 429
        ) {
          setRateLimitMessage(msg ?? t('aiFreeTierLimitReached', 'Free tier limit reached. Try again later.'))
        } else {
          setError(err instanceof Error ? err.message : t('aiErrorDefault'))
        }
      }
    },
    [loading, messages, t, addMessage, updateMessage, removeMessage, setSelectionAsk, placeholders, role, user?.id, requestLimit, requestsUsed, incrementRequestsUsed, sessionId]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectionAsk) {
      handleSend(input.trim(), selectionAsk.text)
    } else {
      handleSend(input)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (selectionAsk) {
        handleSend(input.trim(), selectionAsk.text)
      } else {
        handleSend(input)
      }
    }
  }

  const handleSelectText = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString()?.trim()
    if (!text) {
      const active = document.activeElement as HTMLElement | null
      if (!(active?.tagName === 'TEXTAREA' || active?.closest('[data-chat-form]'))) {
        setSelectionAsk(null)
      }
      return
    }
    const messageId = (sel?.anchorNode?.parentElement?.closest('[data-message-id]') as HTMLElement | null)
      ?.dataset?.messageId
    if (messageId) setSelectionAsk({ text, messageId })
    else setSelectionAsk(null)
  }, [])

  useEffect(() => {
    if (!open) return
    const onSelectionChange = () => {
      const sel = window.getSelection()
      const text = sel?.toString()?.trim()
      const el = sel?.anchorNode?.parentElement?.closest('[data-message-id]') as HTMLElement | null
      const messageId = el?.dataset?.messageId
      if (text && messageId) {
        setSelectionAsk({ text, messageId })
      } else {
        const active = document.activeElement as HTMLElement | null
        const isTypingInChat = active?.tagName === 'TEXTAREA' || active?.closest('[data-chat-form]')
        if (!isTypingInChat) setSelectionAsk(null)
      }
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [open])

  return (
    <>
      <motion.div
        className={cn('fixed inset-0 z-40 bg-black/30', !open && 'pointer-events-none')}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        className="fixed inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-0 z-50 w-full md:max-w-md bg-[var(--color-card)] border-l border-[var(--color-border)] shadow-xl flex flex-col"
        initial={false}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        role="dialog"
        aria-label={t('openAIChat')}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-accent shrink-0" aria-hidden />
              <h2 className="font-semibold text-lg truncate">{t('aiChatTitle')}</h2>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {aiStatus?.ok
                ? (aiStatus.model?.toLowerCase().includes('gpt')
                  ? t('aiPoweredByChatGPT', 'Powered by ChatGPT · Assistant connected')
                  : t('aiPoweredByDeepSeek', 'Powered by DeepSeek · Assistant connected'))
                : aiStatus
                  ? t('aiAssistantUnavailable', 'Assistant temporarily unavailable')
                  : null}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('aiQuestionUsage', { used: requestsUsed, limit: requestLimit, defaultValue: 'Questions this session: {{used}}/{{limit}}' })}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/ai"
              onClick={onClose}
              className="p-2 rounded-input hover:bg-[var(--color-border)]/30 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              title={t('openFullPage')}
              aria-label={t('openFullPage')}
            >
              <Maximize2 className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-input hover:bg-[var(--color-border)]/30"
              aria-label={t('close')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {messages.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col items-center w-full"
            >
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                {t('aiWelcome')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-6 text-center">
                {t('aiSuggestedIntro')}
              </p>
              <form onSubmit={handleSubmit} className="w-full mb-5">
                <div className="flex gap-2 items-center w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 focus-within:border-primary-accent focus-within:ring-2 focus-within:ring-primary-accent focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-card)] transition-all duration-200">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 min-h-[36px] max-h-24 bg-transparent resize-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none text-sm py-1.5"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="shrink-0 w-9 h-9 min-w-9 min-h-9 rounded-full p-0 flex items-center justify-center"
                    icon={<Send className="w-4 h-4" />}
                    aria-label={t('send')}
                  />
                </div>
              </form>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">
                {t('aiSuggestedLabel')}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <motion.button
                    key={q}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.03, duration: 0.2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-border)]/30 text-xs text-[var(--color-text)] transition-colors"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onMouseUp={handleSelectText}
            onTouchEnd={handleSelectText}
          >
            <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                data-message-id={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex gap-2',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {m.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary-accent/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-accent" aria-hidden />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-card px-4 py-2.5 text-sm select-text',
                    m.role === 'user'
                      ? 'bg-primary-accent text-primary-dark'
                      : 'bg-[var(--color-border)]/25 text-[var(--color-text)]'
                  )}
                >
                  {m.role === 'assistant' && m.thinking != null && m.thinking.length > 0 && (
                    <div className="mb-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-2 text-xs text-[var(--color-text-muted)]">
                      <p className="font-medium text-[var(--color-text-muted)] mb-1 opacity-80">{t('thinking', 'Thinking')}</p>
                      <p className="whitespace-pre-wrap break-words">{m.thinking}</p>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">
                    {m.role === 'assistant' && m.text ? (
                      <MessageTextWithLinks text={m.text} className="whitespace-pre-wrap break-words" />
                    ) : m.text ? (
                      m.text
                    ) : loading && m.id === messages[messages.length - 1]?.id ? (
                      <span className="text-[var(--color-text-muted)] animate-pulse">...</span>
                    ) : null}
                  </p>
                </div>
                {m.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-border)]/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden />
                  </div>
                )}
              </motion.div>
            ))}
            </AnimatePresence>
            {loading && (() => {
              const last = messages[messages.length - 1]
              const isStreamingAssistant = last?.role === 'assistant'
              const hasContent = isStreamingAssistant && (Boolean(last?.text) || Boolean(last?.thinking))
              if (isStreamingAssistant && hasContent) return null
              if (isStreamingAssistant) return null
              return (
                <div className="flex gap-2 justify-start">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary-accent/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-accent animate-pulse" aria-hidden />
                  </div>
                  <div className="rounded-card px-4 py-2.5 bg-[var(--color-border)]/25 text-sm text-[var(--color-text-muted)]">
                    {t('typing')}
                  </div>
                </div>
              )
            })()}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {rateLimitMessage && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{rateLimitMessage}</p>
            )}
            {selectionAsk && (
              <div className="p-2 rounded-card bg-primary-accent/10 border border-primary-accent/30 space-y-2">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t('askingAboutSelection')}
                </p>
                <p className="text-sm truncate" title={selectionAsk.text}>
                  &quot;{selectionAsk.text.length > 80 ? selectionAsk.text.slice(0, 80) + '…' : selectionAsk.text}&quot;
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t('aiTypeQuestionBelow')}
                </p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {(messages.length > 0 || loading) && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--color-border)] shrink-0" data-chat-form>
          {selectionAsk && (
            <p className="text-xs text-[var(--color-text-muted)] mb-2">
              {t('askingAboutSelection')}
            </p>
          )}
          <div className="flex gap-2 items-center rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 focus-within:border-primary-accent focus-within:ring-2 focus-within:ring-primary-accent focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-card)] transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectionAsk ? t('aiPlaceholderSelection') : placeholder}
              rows={1}
              className="flex-1 min-h-[36px] max-h-28 bg-transparent resize-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none text-sm py-1.5"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || (!input.trim() && !selectionAsk)} className="shrink-0 w-9 h-9 min-w-9 min-h-9 rounded-full p-0 flex items-center justify-center" icon={<Send className="w-4 h-4" />} aria-label={t('send')} />
          </div>
        </form>
        )}
      </motion.div>
    </>
  )
}
