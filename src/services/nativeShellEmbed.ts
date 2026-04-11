/**
 * When the SPA runs inside an iframe (Expo web embedding edmission-front), the parent
 * must not use eval/cross-origin DOM access. We accept a structured auth seed via
 * postMessage with strict origin allowlist + Zod validation.
 */
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { clearAuth, isAuthExpired, loadAuth, updateLastActivity } from '@/services/authPersistence'

const AUTH_KEYS = ['auth_user', 'auth_accessToken', 'auth_refreshToken', 'auth_lastActivityAt'] as const

const authSeedMessageSchema = z.object({
  __edmission: z.literal(true),
  type: z.literal('AUTH_SEED'),
  v: z.literal(1),
  userJson: z.string().min(1).max(100_000),
  accessToken: z.string().min(1).max(20_000),
  refreshToken: z.union([z.string().max(20_000), z.null()]).optional(),
})

export type NativeShellAuthSeed = z.infer<typeof authSeedMessageSchema>

function getAllowedParentOrigins(): string[] {
  const raw = import.meta.env.VITE_EMBED_PARENT_ORIGINS as string | undefined
  if (raw?.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  if (import.meta.env.DEV) {
    return [
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://localhost:8082',
      'http://127.0.0.1:8082',
      'http://localhost:19006',
      'http://127.0.0.1:19006',
      'http://localhost:19000',
      'http://127.0.0.1:19000',
    ]
  }
  return []
}

function postAuthStateToNative(): void {
  try {
    const bridge = (
      window as unknown as {
        ReactNativeWebView?: { postMessage?: (msg: string) => void }
      }
    ).ReactNativeWebView
    bridge?.postMessage?.(
      JSON.stringify({
        type: 'edmission.auth',
        user: localStorage.getItem('auth_user'),
        accessToken: localStorage.getItem('auth_accessToken'),
        refreshToken: localStorage.getItem('auth_refreshToken'),
        lastActivityAt: localStorage.getItem('auth_lastActivityAt'),
      })
    )
  } catch {
    /* ignore */
  }
}

function installLocalStorageAuthBridge(): void {
  const w = window as unknown as { __edmissionNativeAuthBridge?: boolean }
  if (w.__edmissionNativeAuthBridge) return
  w.__edmissionNativeAuthBridge = true

  const originalSetItem = localStorage.setItem.bind(localStorage)
  const originalRemoveItem = localStorage.removeItem.bind(localStorage)
  const originalClear = localStorage.clear.bind(localStorage)

  localStorage.setItem = function setItem(key: string, value: string) {
    const result = originalSetItem(key, value)
    if (AUTH_KEYS.includes(key as (typeof AUTH_KEYS)[number])) postAuthStateToNative()
    return result
  }

  localStorage.removeItem = function removeItem(key: string) {
    const result = originalRemoveItem(key)
    if (AUTH_KEYS.includes(key as (typeof AUTH_KEYS)[number])) postAuthStateToNative()
    return result
  }

  localStorage.clear = function clear() {
    const result = originalClear()
    postAuthStateToNative()
    return result
  }
}

export function applyNativeShellAuthSeed(seed: {
  userJson: string
  accessToken: string
  refreshToken?: string | null
}): void {
  installLocalStorageAuthBridge()
  try {
    localStorage.setItem('auth_user', seed.userJson)
    localStorage.setItem('auth_accessToken', seed.accessToken)
    if (seed.refreshToken != null && seed.refreshToken !== '') {
      localStorage.setItem('auth_refreshToken', seed.refreshToken)
    } else {
      localStorage.removeItem('auth_refreshToken')
    }
    localStorage.setItem('auth_lastActivityAt', String(Date.now()))
    postAuthStateToNative()
  } catch {
    /* ignore */
  }
}

function syncStoreFromPersistence(): void {
  const stored = loadAuth()
  if (!stored) {
    clearAuth()
    useAuthStore.getState().logout()
    return
  }
  if (isAuthExpired(stored.lastActivityAt)) {
    clearAuth()
    useAuthStore.getState().logout()
    return
  }
  useAuthStore.getState().setAuth(stored.user, stored.accessToken)
  updateLastActivity()
}

/**
 * Call once at startup (before or alongside auth hydrate). Ignored on native RN (no parent window).
 */
export function installNativeShellEmbedListener(): void {
  if (typeof window === 'undefined') return

  const allowed = getAllowedParentOrigins()
  if (allowed.length === 0 && !import.meta.env.DEV) {
    return
  }

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window.parent) return
    if (!allowed.includes(event.origin)) return

    const parsed = authSeedMessageSchema.safeParse(event.data)
    if (!parsed.success) return

    const { __edmission: _e, type: _t, v: _v, ...rest } = parsed.data
    applyNativeShellAuthSeed(rest)
    syncStoreFromPersistence()
  })
}
