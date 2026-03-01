import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Send, Maximize2, Bot, User } from 'lucide-react'
import { sendAIChat } from '@/services/ai'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const SUGGESTED_QUESTIONS = [
  'How do I choose a university?',
  'What documents do I need for application?',
  'How does the scholarship process work?',
  'Where do I fill in my GPA?',
  'Help me complete my profile.',
]

interface AIChatDrawerProps {
  open: boolean
  onClose: () => void
}

export function AIChatDrawer({ open, onClose }: AIChatDrawerProps) {
  const { t } = useTranslation('common')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null)
  const [selectionAsk, setSelectionAsk] = useState<{ text: string; messageId: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const buildHistory = useCallback((): { role: 'user' | 'assistant'; content: string }[] => {
    return messages.slice(-20).map((m) => ({ role: m.role, content: m.text }))
  }, [messages])

  const handleSend = useCallback(
    async (text: string, selectedText?: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setInput('')
      setError(null)
      setRateLimitMessage(null)
      setSelectionAsk(null)

      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: trimmed }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const history = buildHistory()
        const res = await sendAIChat({
          message: trimmed,
          history,
          selectedText,
        })
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: res.text ?? '',
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string; code?: string } } }).response?.data?.message
            : null
        if (
          msg?.toLowerCase().includes('limit') ||
          (err as { response?: { status?: number } }).response?.status === 429
        ) {
          setRateLimitMessage(msg ?? 'Free tier limit reached. Try again later.')
        } else {
          setError(msg ?? t('aiErrorDefault'))
        }
      } finally {
        setLoading(false)
      }
    },
    [loading, buildHistory, t]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectionAsk) {
      handleSend(
        input.trim() || `What did you mean by this? Can you explain?`,
        selectionAsk.text
      )
    } else {
      handleSend(input)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (selectionAsk) {
        handleSend(
          input.trim() || `What did you mean by this? Can you explain?`,
          selectionAsk.text
        )
      } else {
        handleSend(input)
      }
    }
  }

  const handleSelectText = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString()?.trim()
    if (!text) {
      setSelectionAsk(null)
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
      if (text && messageId) setSelectionAsk({ text, messageId })
      else setSelectionAsk(null)
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [open])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[var(--color-card)] border-l border-[var(--color-border)] shadow-xl flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label={t('openAIChat')}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="w-5 h-5 text-primary-accent shrink-0" aria-hidden />
            <h2 className="font-semibold text-lg truncate">{t('aiChatTitle')}</h2>
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
          <div className="p-4 overflow-y-auto flex-1">
            <p className="text-sm text-[var(--color-text-muted)] mb-4">{t('aiSuggestedIntro')}</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">{t('aiSuggestedLabel')}</p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="block w-full text-left px-3 py-2.5 rounded-card border border-[var(--color-border)] hover:bg-[var(--color-border)]/20 text-sm transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onMouseUp={handleSelectText}
            onTouchEnd={handleSelectText}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                data-message-id={m.id}
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
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                </div>
                {m.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-border)]/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary-accent/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-accent animate-pulse" aria-hidden />
                </div>
                <div className="rounded-card px-4 py-2.5 bg-[var(--color-border)]/25 text-sm text-[var(--color-text-muted)]">
                  {t('typing')}
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {rateLimitMessage && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{rateLimitMessage}</p>
            )}
            {selectionAsk && (
              <div className="flex items-center gap-2 p-2 rounded-card bg-primary-accent/10 border border-primary-accent/30">
                <span className="text-xs text-[var(--color-text-muted)] flex-1 truncate" title={selectionAsk.text}>
                  &quot;{selectionAsk.text.slice(0, 50)}...&quot;
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    handleSend(
                      input.trim() || 'What did you mean by this? Can you explain in more detail?',
                      selectionAsk.text
                    )
                  }}
                  disabled={loading}
                >
                  {t('askAboutThis')}
                </Button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--color-border)] shrink-0">
          {selectionAsk && (
            <p className="text-xs text-[var(--color-text-muted)] mb-2">
              {t('askingAboutSelection')}
            </p>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectionAsk ? t('aiPlaceholderFollowUp') : t('aiPlaceholder')}
              rows={1}
              className="flex-1 min-h-[44px] max-h-32 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent resize-y"
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading || (!input.trim() && !selectionAsk)} className="shrink-0" icon={<Send className="w-4 h-4" />}>
              {t('send')}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
