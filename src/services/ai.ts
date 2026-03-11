import { api } from './api'
import { useAuthStore } from '@/store/authStore'

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface SendAIChatParams {
  message: string
  history?: ChatHistoryItem[]
  selectedText?: string
}

export interface AIStatus {
  ok: boolean
  model: string
}

export type StreamChunk = { type: 'content' | 'thinking'; text: string }

export async function getAIStatus(): Promise<AIStatus> {
  const { data } = await api.get<AIStatus>('/ai/status')
  return data
}

export async function sendAIChat(params: SendAIChatParams): Promise<{ text: string }> {
  const { data } = await api.post<{ reply: string }>('/ai/chat', {
    message: params.message,
    history: params.history,
    selectedText: params.selectedText,
  })
  return { text: data.reply ?? '' }
}

/**
 * Stream AI chat: calls onChunk for each content/thinking piece and onDone when finished.
 * Uses fetch + ReadableStream so the user sees tokens and thinking as they arrive.
 */
export async function sendAIChatStream(
  params: SendAIChatParams,
  callbacks: {
    onChunk: (chunk: StreamChunk) => void
    onDone: () => void
    onError: (message: string) => void
  }
): Promise<void> {
  const token = useAuthStore.getState().accessToken
  if (!token) {
    callbacks.onError('Not authenticated')
    return
  }

  const res = await fetch(`${baseURL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      message: params.message,
      history: params.history,
      selectedText: params.selectedText,
      stream: true,
    }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    callbacks.onError(data.message ?? `Request failed: ${res.status}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        try {
          const payload = JSON.parse(trimmed.slice(6)) as { t: string; d?: string }
          if (payload.t === 'done') {
            callbacks.onDone()
            return
          }
          if (payload.t === 'error' && payload.d) {
            callbacks.onError(payload.d)
            return
          }
          if ((payload.t === 'content' || payload.t === 'thinking') && payload.d !== undefined) {
            callbacks.onChunk({ type: payload.t as 'content' | 'thinking', text: payload.d })
          }
        } catch (_) {
          /* skip malformed */
        }
      }
    }
    callbacks.onDone()
  } catch (e) {
    callbacks.onError(e instanceof Error ? e.message : 'Stream failed')
  }
}
