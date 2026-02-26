import { api } from './api'

export interface HealthResponse {
  status: string
  timestamp: string
  ip?: string
}

/** Проверка доступности бэкенда. Не требует авторизации. */
export async function checkBackendHealth(): Promise<{
  ok: boolean
  data?: HealthResponse
  error?: string
}> {
  try {
    const { data } = await api.get<HealthResponse>('/health')
    return { ok: true, data }
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Backend unreachable'
    return { ok: false, error: message }
  }
}

let healthCheckDone = false

/** Вызвать проверку бэкенда один раз за сессию (для провайдера при старте приложения). */
export function checkBackendHealthOnce(): void {
  if (healthCheckDone) return
  healthCheckDone = true
  checkBackendHealth().catch(() => {})
}
