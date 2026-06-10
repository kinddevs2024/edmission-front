import type { User } from '@/types/user'
import { clearActAsUniversityUserId } from '@/constants/actAsUniversity'

const KEY_USER = 'auth_user'
const KEY_ACCESS = 'auth_accessToken'
const KEY_REFRESH = 'auth_refreshToken'
const KEY_ACTIVITY = 'auth_lastActivityAt'
const KEY_TUTORIAL_STUDENT = 'edmission_tutorial_student_seen'
const KEY_TUTORIAL_UNIVERSITY = 'edmission_tutorial_university_seen'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export interface StoredAuth {
  user: User
  accessToken: string
  lastActivityAt: number
}

export function saveAuth(user: User, accessToken: string, refreshToken?: string | null): void {
  try {
    void refreshToken
    const now = Date.now()
    localStorage.setItem(KEY_USER, JSON.stringify(user))
    localStorage.setItem(KEY_ACCESS, accessToken)
    localStorage.removeItem(KEY_REFRESH)
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
    return { user, accessToken, lastActivityAt: at }
  } catch {
    return null
  }
}

export function getStoredRefreshToken(): string | null {
  return null
}

export function isAuthExpired(lastActivityAt: number): boolean {
  return Date.now() - lastActivityAt > THIRTY_DAYS_MS
}

export function clearAuth(): void {
  try {
    clearActAsUniversityUserId()
    localStorage.removeItem(KEY_USER)
    localStorage.removeItem(KEY_ACCESS)
    localStorage.removeItem(KEY_REFRESH)
    localStorage.removeItem(KEY_ACTIVITY)
    localStorage.removeItem(KEY_TUTORIAL_STUDENT)
    localStorage.removeItem(KEY_TUTORIAL_UNIVERSITY)
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
