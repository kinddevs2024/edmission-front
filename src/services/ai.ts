import { api } from './api'
import { getStoredRefreshToken, saveAuth, clearAuth } from './authPersistence'
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
  sessionId?: string
}

export interface AIStatus {
  ok: boolean
  model: string
}

export type StreamChunk = { type: 'content' | 'thinking'; text: string }

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null
  try {
    const { data } = await api.post<{ user: import('@/types/user').User; accessToken: string }>('/auth/refresh', { refreshToken })
    saveAuth(data.user, data.accessToken, refreshToken)
    useAuthStore.getState().setAuth(data.user, data.accessToken)
    return data.accessToken
  } catch {
    clearAuth()
    useAuthStore.getState().logout()
    return null
  }
}

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
  let token = useAuthStore.getState().accessToken
  if (!token) {
    callbacks.onError('Not authenticated')
    return
  }

  const createRequest = (authToken: string) =>
    fetch(`${baseURL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        message: params.message,
        history: params.history,
        selectedText: params.selectedText,
        sessionId: params.sessionId,
        stream: true,
      }),
    })

  let res = await createRequest(token)
  if (res.status === 401) {
    const refreshedToken = await refreshAccessToken()
    if (!refreshedToken) {
      callbacks.onError('Session expired. Please sign in again.')
      return
    }
    token = refreshedToken
    res = await createRequest(token)
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    callbacks.onError(data.message ?? `Request failed: ${res.status}`)
    return
  }

  const contentType = res.headers.get('Content-Type') ?? ''

  // Backend returned JSON { reply: "..." } (non-streaming)
  if (contentType.includes('application/json')) {
    try {
      const data = (await res.json()) as { reply?: string }
      const reply = data.reply ?? ''
      if (reply) callbacks.onChunk({ type: 'content', text: reply })
      callbacks.onDone()
    } catch (_) {
      callbacks.onError('Invalid response')
    }
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  function processLines(chunk: string): boolean {
    const lines = chunk.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      try {
        const payload = JSON.parse(trimmed.slice(6)) as { t: string; d?: string }
        if (payload.t === 'done') return true
        if (payload.t === 'error' && payload.d) {
          callbacks.onError(payload.d)
          return true
        }
        if ((payload.t === 'content' || payload.t === 'thinking') && payload.d !== undefined) {
          callbacks.onChunk({ type: payload.t as 'content' | 'thinking', text: String(payload.d) })
        }
      } catch (_) {
        /* skip malformed */
      }
    }
    return false
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (value) buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      if (processLines(lines.join('\n'))) return
      if (done) break
    }
    if (buffer.trim() && processLines(buffer)) return
    callbacks.onDone()
  } catch (e) {
    callbacks.onError(e instanceof Error ? e.message : 'Stream failed')
  }
}
