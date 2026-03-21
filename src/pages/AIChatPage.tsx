import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Send, Bot, User } from 'lucide-react'
import { MessageTextWithLinks } from '@/utils/linkifyPaths'
import { parseAIActions } from '@/utils/parseAIActions'
import { sendAIChatStream, getAIStatus, type AIStatus } from '@/services/ai'
import { updateStudentProfile } from '@/services/student'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { useAIChatStore, type ChatMessage } from '@/store/aiChatStore'

const FALLBACK_PLACEHOLDERS = ['Type your question…', 'What would you like to ask?', 'How can I help?']
const FALLBACK_SUGGESTED = [
  'How to choose a university?',
  'What documents are needed for admission?',
  'How does the scholarship process work?',
  'Where do I enter my GPA?',
  'Help me fill out my profile',
  'Find universities for me',
]

export function AIChatPage() {
  const { t } = useTranslation('common')
  const suggestedQuestions = (t('aiSuggestedQuestions', { returnObjects: true }) as string[] | undefined) ?? FALLBACK_SUGGESTED
  const placeholdersRaw = t('aiPlaceholders', { returnObjects: true })
  const placeholders = Array.isArray(placeholdersRaw) ? (placeholdersRaw as string[]) : FALLBACK_PLACEHOLDERS
  const [placeholderIndex, setPlaceholderIndex] = useState(() => Math.floor(Math.random() * Math.max(1, placeholders.length)))
  const placeholder = placeholders[placeholderIndex % placeholders.length]
  const { role, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
  const initialQ = searchParams.get('q') ?? ''
  const [input, setInput] = useState(initialQ)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null)
  const [, setAIStatus] = useState<AIStatus | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAIStatus()
      .then(setAIStatus)
      .catch(() => setAIStatus({ ok: false, model: '' }))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = useCallback(
    async (text: string, selectedText?: string) => {
      const trimmed = text.trim() || (selectedText ? 'Please explain or elaborate on the selected part.' : '')
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
      addMessage({ id: assistantId, role: 'assistant', text: '', thinking: '' })

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
                    patch.birthDate = `${new Date().getFullYear() - age}-01-01`
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
              removeMessage(assistantId)
              if (message.toLowerCase().includes('limit') || message.includes('429')) {
                setRateLimitMessage(message)
              } else {
                setError(message)
              }
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
          setRateLimitMessage(msg ?? 'Free tier limit reached. Try again later.')
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
    const el = sel?.anchorNode?.parentElement?.closest('[data-message-id]') as HTMLElement | null
    const messageId = el?.dataset?.messageId
    if (text && messageId) {
      setSelectionAsk({ text, messageId })
    } else {
      const active = document.activeElement as HTMLElement | null
      if (!(active?.tagName === 'TEXTAREA' || active?.closest('[data-chat-form]'))) {
        setSelectionAsk(null)
      }
    }
  }, [setSelectionAsk])

  useEffect(() => {
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
  }, [setSelectionAsk])

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] min-h-[400px] overflow-hidden">

      <div className="flex-1 flex flex-col min-h-0 border border-[var(--color-border)] rounded-card bg-[var(--color-card)] overflow-hidden">
        {messages.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center w-full max-w-2xl"
            >
              <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                {t('aiWelcome', 'С чего начнём?')}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-8">
                {t('aiSuggestedIntro', 'Спросите об университетах, заявках или стипендиях.')}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                {t('aiQuestionUsage', { used: requestsUsed, limit: requestLimit, defaultValue: 'Questions this session: {{used}}/{{limit}}' })}
              </p>
              <form
                onSubmit={handleSubmit}
                className="w-full mb-6"
              >
                <div className="flex gap-2 items-center w-full rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 focus-within:border-primary-accent focus-within:ring-2 focus-within:ring-primary-accent focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-card)] transition-all duration-300">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 min-h-[36px] max-h-32 bg-transparent resize-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none text-base py-1.5"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="shrink-0 w-10 h-10 min-w-10 min-h-10 rounded-full p-0 flex items-center justify-center"
                    icon={<Send className="w-5 h-5" />}
                    aria-label={t('send')}
                  />
                </div>
              </form>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                {t('aiSuggestedLabel')}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((q, i) => (
                  <motion.button
                    key={q}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-border)]/30 hover:border-primary-accent/50 text-sm text-[var(--color-text)] transition-all duration-200"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
            onMouseUp={handleSelectText}
            onTouchEnd={handleSelectText}
          >
            <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                data-message-id={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'flex gap-3 max-w-3xl',
                  m.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
                )}
              >
                {m.role === 'assistant' && (
                  <div className="shrink-0 w-9 h-9 rounded-full bg-primary-accent/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-accent" aria-hidden />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-card px-4 py-3 text-sm select-text',
                    m.role === 'user'
                      ? 'bg-primary-accent text-primary-dark'
                      : 'bg-[var(--color-border)]/25 text-[var(--color-text)]'
                  )}
                >
                  {m.role === 'assistant' && m.thinking != null && m.thinking.length > 0 && (
                    <div className="mb-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-2 text-xs text-[var(--color-text-muted)]">
                      <p className="font-medium mb-1 opacity-80">{t('aiThinking')}</p>
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
                  <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-border)]/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
                  </div>
                )}
              </motion.div>
            ))}
            </AnimatePresence>
            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3 justify-start">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary-accent/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-accent animate-pulse" aria-hidden />
                </div>
                <div className="rounded-card px-4 py-3 bg-[var(--color-border)]/25 text-[var(--color-text-muted)]">
                  {t('typing')}
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {rateLimitMessage && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{rateLimitMessage}</p>
            )}
            {selectionAsk && (
              <div className="p-3 rounded-card bg-primary-accent/10 border border-primary-accent/30 max-w-3xl space-y-2">
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
        <motion.form
          initial={false}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit}
          className="w-full p-4 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-card)]"
          data-chat-form
        >
          {selectionAsk && (
            <p className="text-xs text-[var(--color-text-muted)] mb-2">{t('askingAboutSelection')}</p>
          )}
          <div className="flex gap-2 items-center w-full rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 focus-within:border-primary-accent focus-within:ring-2 focus-within:ring-primary-accent focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-card)] transition-all duration-200">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectionAsk ? t('aiPlaceholderSelection') : placeholder}
              rows={1}
              className="flex-1 min-h-[36px] max-h-40 w-full bg-transparent resize-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none text-sm py-1.5"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || (!input.trim() && !selectionAsk)}
              className="shrink-0 w-10 h-10 min-w-10 min-h-10 rounded-full p-0 flex items-center justify-center"
              icon={<Send className="w-5 h-5" />}
              aria-label={t('send')}
            />
          </div>
        </motion.form>
        )}
      </div>
    </div>
  )
}
