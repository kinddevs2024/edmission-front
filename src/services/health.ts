import { api } from './api'

export interface HealthResponse {
  status: string
  timestamp: string
  ip?: string
}

function isHtmlResponse(body: unknown): boolean {
  if (typeof body !== 'string') return false
  const s = body.trim()
  return s.startsWith('<') || s.includes('<!DOCTYPE') || s.includes('<html')
}

const NGINX_HINT =
  'Nginx не проксирует /api на бэкенд. Добавьте в конфиг: location /api/ { proxy_pass http://127.0.0.1:4000/api/; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }'

/** Проверка доступности бэкенда. Не требует авторизации. Ожидает JSON. */
export async function checkBackendHealth(): Promise<{
  ok: boolean
  data?: HealthResponse
  error?: string
}> {
  try {
    const res = await api.get('/health', {
      validateStatus: () => true,
      responseType: 'text',
    })
    const raw = res.data as string
    const body: unknown = (() => {
      if (isHtmlResponse(raw)) return raw
      try {
        return JSON.parse(raw) as unknown
      } catch {
        return raw
      }
    })()

    if (res.status === 405) {
      return { ok: false, error: `405 Not Allowed. ${NGINX_HINT}` }
    }

    if (typeof body === 'string' && isHtmlResponse(body)) {
      return {
        ok: false,
        error: `Вместо JSON пришёл HTML. ${NGINX_HINT}`,
      }
    }

    if (res.status !== 200 || body == null || typeof body !== 'object') {
      return {
        ok: false,
        error: res.status !== 200
          ? `Сервер вернул ${res.status}. ${NGINX_HINT}`
          : 'Неверный ответ бэкенда',
      }
    }

    const data = body as HealthResponse
    if (data.status !== 'ok') {
      return { ok: false, error: 'Неверный ответ бэкенда' }
    }
    return { ok: true, data }
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Бэкенд недоступен'
    const isHtml = err && typeof err === 'object' && 'response' in err
      && (err as { response?: { data?: unknown } }).response?.data != null
      && isHtmlResponse((err as { response: { data: unknown } }).response.data)
    return {
      ok: false,
      error: isHtml ? `Вместо JSON пришёл HTML. ${NGINX_HINT}` : msg,
    }
  }
}

let healthCheckDone = false

/** Вызвать проверку бэкенда один раз за сессию (для провайдера при старте приложения). */
export function checkBackendHealthOnce(): void {
  if (healthCheckDone) return
  healthCheckDone = true
  checkBackendHealth().catch(() => {})
}
