import type { User } from '@/types/user'

const KEY_USER = 'auth_user'
const KEY_ACCESS = 'auth_accessToken'
const KEY_REFRESH = 'auth_refreshToken'
const KEY_ACTIVITY = 'auth_lastActivityAt'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export interface StoredAuth {
  user: User
  accessToken: string
  refreshToken: string | null
  lastActivityAt: number
}

export function saveAuth(user: User, accessToken: string, refreshToken?: string | null): void {
  try {
    const now = Date.now()
    localStorage.setItem(KEY_USER, JSON.stringify(user))
    localStorage.setItem(KEY_ACCESS, accessToken)
    if (refreshToken != null) localStorage.setItem(KEY_REFRESH, refreshToken)
    localStorage.setItem(KEY_ACTIVITY, String(now))
  } catch {
    /* ignore */
  }
}

export function loadAuth(): StoredAuth | null {
  try {
    const userStr = localStorage.getItem(KEY_USER)
    const accessToken = localStorage.getItem(KEY_ACCESS)
    const lastActivityAt = localStorage.getItem(KEY_ACTIVITY)
    if (!userStr || !accessToken || !lastActivityAt) return null
    const user = JSON.parse(userStr) as User
    const at = Number(lastActivityAt)
    if (Number.isNaN(at)) return null
    const refreshToken = localStorage.getItem(KEY_REFRESH)
    return { user, accessToken, refreshToken, lastActivityAt: at }
  } catch {
    return null
  }
}

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(KEY_REFRESH)
  } catch {
    return null
  }
}

export function isAuthExpired(lastActivityAt: number): boolean {
  return Date.now() - lastActivityAt > THIRTY_DAYS_MS
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(KEY_USER)
    localStorage.removeItem(KEY_ACCESS)
    localStorage.removeItem(KEY_REFRESH)
    localStorage.removeItem(KEY_ACTIVITY)
  } catch {
    /* ignore */
  }
}

export function updateLastActivity(): void {
  try {
    localStorage.setItem(KEY_ACTIVITY, String(Date.now()))
  } catch {
    /* ignore */
  }
}
