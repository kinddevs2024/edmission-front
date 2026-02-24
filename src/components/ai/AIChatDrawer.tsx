import { useState, useRef, useEffect } from 'react'
import { sendAIChat } from '@/services/ai'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const SUGGESTED_QUESTIONS = [
  'How do I choose a university?',
  'What documents do I need for application?',
  'How does the scholarship process work?',
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface AIChatDrawerProps {
  open: boolean
  onClose: () => void
}

export function AIChatDrawer({ open, onClose }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setInput('')
    setError(null)
    setRateLimitMessage(null)
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await sendAIChat(trimmed)
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: res.text ?? 'No response.',
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string; code?: string } } }).response?.data?.message
        : null
      if (msg?.toLowerCase().includes('limit') || (err as { response?: { status?: number } }).response?.status === 429) {
        setRateLimitMessage(msg ?? 'Free tier limit reached. Try again later.')
      } else {
        setError(msg ?? 'Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

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
        aria-label="Edmission AI Chat"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-lg">Edmission AI</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-input hover:bg-[var(--color-border)]/30"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {messages.length === 0 && !loading ? (
          <div className="p-4">
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Ask me about universities, applications, or scholarships.</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Suggested questions:</p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="block w-full text-left px-3 py-2 rounded-input border border-[var(--color-border)] hover:bg-[var(--color-border)]/20 text-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-card px-3 py-2 text-sm',
                    m.role === 'user'
                      ? 'bg-primary-accent text-primary-dark'
                      : 'bg-[var(--color-border)]/30 text-[var(--color-text)]'
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-card px-3 py-2 bg-[var(--color-border)]/30 text-sm text-[var(--color-text-muted)]">
                  Typing...
                </div>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {rateLimitMessage && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{rateLimitMessage}</p>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--color-border)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
