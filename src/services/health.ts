/**
 * Проверка здоровья бэкенда. Вызывается один раз при первом заходе на сайт.
 */

let checked = false

export type HealthResult = { ok: boolean; ip?: string }

/**
 * Проверяет /health на текущем хосте. Выполняется один раз за сессию (повторные вызовы не идут в сеть).
 */
export async function checkBackendHealthOnce(): Promise<HealthResult> {
  if (checked) {
    return { ok: true }
  }
  checked = true
  const url = `${window.location.origin}/health`
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'same-origin' })
    const data = (await res.json().catch(() => ({}))) as { status?: string; ip?: string }
    const ok = res.ok && data.status === 'ok'
    return { ok, ip: data.ip }
  } catch {
    return { ok: false }
  }
}
