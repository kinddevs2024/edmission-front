import { api, getApiError } from './api'
import type { User, LoginResponse } from '@/types/user'
import { useAuthStore } from '@/store/authStore'
import { useAIChatStore } from '@/store/aiChatStore'
import { saveAuth, clearAuth, getStoredRefreshToken } from './authPersistence'
import { queryClient } from '@/app/queryClient'
import i18n, { loadLanguage } from '@/i18n'
import { STORAGE_KEY, type SupportedLng } from '@/i18n/config'

function isNativeShell(): boolean {
  return Boolean((window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView)
}

function postNativeLogout(): void {
  try {
    const bridge = (window as unknown as { ReactNativeWebView?: { postMessage?: (message: string) => void } }).ReactNativeWebView
    bridge?.postMessage?.(JSON.stringify({ type: 'edmission.logout' }))
  } catch {
    /* ignore */
  }
}

function normalizeUserLanguage(raw: unknown): SupportedLng | null {
  const value = String(raw ?? '').trim().toLowerCase()
  return value === 'en' || value === 'ru' || value === 'uz' ? value : null
}

async function applyAuthLanguage(user: User): Promise<void> {
  const language = normalizeUserLanguage(user.language)
  if (!language) return
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    /* ignore */
  }
  await loadLanguage(language)
  await i18n.changeLanguage(language)
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginByPhonePayload {
  phone: string
  password: string
}

export interface PhoneCodeStartPayload {
  phone: string
  role?: 'student' | 'university'
  acceptTerms?: boolean
  firstName?: string
  lastName?: string
  email?: string
}

export type PhoneCodeStartResult =
  | {
      mode: 'login'
      phone: string
      delivery: 'telegram'
      expiresAt: string
    }
  | {
      mode: 'telegram_required' | 'register'
      phone: string
      sessionId: string
      deepLink: string
      expiresAt: string
      message?: string
    }

export interface RegisterPayload {
  email: string
  phone?: string
  password: string
  role: 'student' | 'university' | 'school_counsellor'
  acceptTerms: boolean
  name?: string
  avatarUrl?: string
}

export type RegisterResult =
  | { needsVerification: true; email: string }
  | LoginResponse

export interface PhoneRegisterStartPayload {
  phone: string
  role: 'student' | 'university'
  acceptTerms: boolean
}

export interface PhoneRegisterStartResult {
  registrationId: string
  phone: string
  verification: {
    method: 'code' | 'telegram'
    code: string
    expiresAt: string
    deepLink: string
  }
}

export interface PhoneRegisterStatusResult {
  verifiedViaTelegram: boolean
  verifiedAt: string | null
  expiresAt: string | null
}

export interface TelegramAuthStartResult {
  sessionId: string
  deepLink: string
  expiresAt: string
}

export interface TelegramAuthVerifyPayload {
  sessionId: string
  code: string
}

export interface TelegramAuthVerifyLinkPayload {
  sessionId: string
  token: string
}

export interface TelegramAuthVerifyReadyPayload {
  sessionId: string
}

const TELEGRAM_PENDING_AUTH_KEY = 'edmission.telegram.pending.auth'
const TELEGRAM_SESSION_ID_REGEX = /^[a-f0-9]{32}$/i

export type PendingTelegramAuth = {
  sessionId: string
  role?: 'student' | 'university'
  startedAt: number
}

export function savePendingTelegramAuthSession(payload: { sessionId: string; role?: 'student' | 'university' }): void {
  const sessionId = String(payload.sessionId ?? '').trim().toLowerCase()
  if (!TELEGRAM_SESSION_ID_REGEX.test(sessionId)) return
  const row: PendingTelegramAuth = {
    sessionId,
    ...(payload.role ? { role: payload.role } : {}),
    startedAt: Date.now(),
  }
  try {
    localStorage.setItem(TELEGRAM_PENDING_AUTH_KEY, JSON.stringify(row))
  } catch {
    /* ignore */
  }
}

export function getPendingTelegramAuthSession(): PendingTelegramAuth | null {
  try {
    const raw = localStorage.getItem(TELEGRAM_PENDING_AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { sessionId?: unknown; role?: unknown; startedAt?: unknown }
    const sessionId = String(parsed.sessionId ?? '').trim().toLowerCase()
    if (!TELEGRAM_SESSION_ID_REGEX.test(sessionId)) return null
    const startedAt = Number(parsed.startedAt)
    return {
      sessionId,
      ...(parsed.role === 'student' || parsed.role === 'university' ? { role: parsed.role } : {}),
      startedAt: Number.isFinite(startedAt) && startedAt > 0 ? startedAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function clearPendingTelegramAuthSession(): void {
  try {
    localStorage.removeItem(TELEGRAM_PENDING_AUTH_KEY)
  } catch {
    /* ignore */
  }
}

export async function loginWithGoogle(payload: {
  idToken: string
  /** Defaults to student on the server if omitted and terms are accepted (new account). */
  role?: 'student' | 'university'
  /** Required for new OAuth accounts; login page sends true so first-time Google users are registered. */
  acceptTerms: boolean
}): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/google', {
    idToken: payload.idToken,
    ...(payload.role != null ? { role: payload.role } : {}),
    acceptTerms: payload.acceptTerms,
  })
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function loginWithYandex(payload: {
  code: string
  redirectUri: string
  role?: 'student' | 'university'
  acceptTerms: boolean
}): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/yandex', {
    code: payload.code,
    redirectUri: payload.redirectUri,
    ...(payload.role != null ? { role: payload.role } : {}),
    acceptTerms: payload.acceptTerms,
  })
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function loginWithApple(payload: {
  code: string
  redirectUri: string
  idToken?: string
  user?: {
    name?: {
      firstName?: string
      lastName?: string
    }
    email?: string
  }
  role?: 'student' | 'university'
  acceptTerms: boolean
}): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/apple', {
    code: payload.code,
    redirectUri: payload.redirectUri,
    ...(payload.idToken != null ? { idToken: payload.idToken } : {}),
    ...(payload.user != null ? { user: payload.user } : {}),
    ...(payload.role != null ? { role: payload.role } : {}),
    acceptTerms: payload.acceptTerms,
  })
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

/** Yandex Passport SDK (YaAuthSuggest) — после получения OAuth access_token на клиенте. */
export async function loginWithYandexAccessToken(payload: {
  accessToken: string
  role?: 'student' | 'university'
  acceptTerms: boolean
}): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/yandex/access-token', {
    accessToken: payload.accessToken,
    ...(payload.role != null ? { role: payload.role } : {}),
    acceptTerms: payload.acceptTerms,
  })
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  // Всегда начинаем логин "с нуля": очищаем возможные старые токены/пользователя
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function exchangeMobileWebAuthSession(token: string): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/mobile-web/exchange', { token })
  await applyAuthLanguage(data.user)
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function startTelegramAuth(payload?: { role?: 'student' | 'university' }): Promise<TelegramAuthStartResult> {
  const { data } = await api.post<TelegramAuthStartResult>('/auth/telegram/start', payload ?? {})
  return data
}

export async function verifyTelegramAuth(payload: TelegramAuthVerifyPayload): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/telegram/verify', payload)
  clearPendingTelegramAuthSession()
  await applyAuthLanguage(data.user)
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function verifyTelegramAuthLink(payload: TelegramAuthVerifyLinkPayload): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/telegram/verify-link', payload)
  clearPendingTelegramAuthSession()
  await applyAuthLanguage(data.user)
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function verifyTelegramAuthReady(payload: TelegramAuthVerifyReadyPayload): Promise<LoginResponse | null> {
  const response = await api.post<LoginResponse | { ready: false }>(
    '/auth/telegram/verify-ready',
    payload,
    { validateStatus: (status) => (status >= 200 && status < 300) || status === 202 }
  )

  if (response.status === 202 || ('ready' in response.data && response.data.ready === false)) {
    return null
  }

  const data = response.data as LoginResponse
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  clearPendingTelegramAuthSession()
  await applyAuthLanguage(data.user)
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function loginByPhone(payload: LoginByPhonePayload): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/login-phone', payload)
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function startPhoneCodeAuth(payload: PhoneCodeStartPayload): Promise<PhoneCodeStartResult> {
  const { data } = await api.post<PhoneCodeStartResult>('/auth/phone/start', payload)
  return data
}

export async function verifyPhoneCodeAuth(payload: { phone: string; code: string }): Promise<LoginResponse> {
  clearAuth()
  useAuthStore.getState().logout()
  useAIChatStore.getState().resetSession()
  const { data } = await api.post<LoginResponse>('/auth/phone/verify', payload)
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const body: Record<string, unknown> = {
    email: payload.email,
    password: payload.password,
    role: payload.role,
    acceptTerms: payload.acceptTerms,
  }
  if (payload.phone) body.phone = payload.phone
  if (payload.name) body.name = payload.name
  if (payload.avatarUrl) body.avatarUrl = payload.avatarUrl
  const { data } = await api.post<RegisterResult>('/auth/register', body)
  if ('needsVerification' in data && data.needsVerification) {
    return { needsVerification: true, email: data.email }
  }
  const loginData = data as LoginResponse
  useAIChatStore.getState().resetSession()
  useAuthStore.getState().setAuth(loginData.user, loginData.accessToken)
  saveAuth(loginData.user, loginData.accessToken, loginData.refreshToken ?? null)
  return loginData
}

export async function startPhoneRegistration(payload: PhoneRegisterStartPayload): Promise<PhoneRegisterStartResult> {
  const { data } = await api.post<PhoneRegisterStartResult>('/auth/register-phone/start', payload)
  return data
}

export async function getPhoneRegistrationStatus(registrationId: string): Promise<PhoneRegisterStatusResult> {
  const { data } = await api.get<PhoneRegisterStatusResult>(`/auth/register-phone/${registrationId}/status`)
  return data
}

export async function completePhoneRegistration(payload: {
  registrationId: string
  code?: string
  password: string
}): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register-phone/complete', payload)
  useAIChatStore.getState().resetSession()
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function verifyEmailByCode(email: string, code: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/verify-email', { email, code })
  useAIChatStore.getState().resetSession()
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

/** Resend 6-digit verification code. Available after 60s cooldown. */
export async function resendVerificationCode(email: string): Promise<void> {
  await api.post('/auth/verify-email/resend', { email })
}

export async function startLinkEmail(email: string): Promise<{ success: true; email: string; expiresAt: string }> {
  const { data } = await api.post<{ success: true; email: string; expiresAt: string }>('/auth/link-email/start', { email })
  return data
}

export async function verifyLinkEmail(payload: { email: string; code: string }): Promise<User> {
  const { data } = await api.post<User>('/auth/link-email/verify', payload)
  useAuthStore.getState().setUser(data)
  const token = useAuthStore.getState().accessToken
  if (token) {
    saveAuth(data, token, getStoredRefreshToken())
  }
  return data
}

export async function logout(): Promise<void> {
  const refreshToken = getStoredRefreshToken()
  try {
    await api.post('/auth/logout', { refreshToken: refreshToken ?? undefined })
  } finally {
    clearPendingTelegramAuthSession()
    clearAuth()
    queryClient.clear()
    useAuthStore.getState().logout()
    useAIChatStore.getState().resetSession()
    if (isNativeShell()) {
      postNativeLogout()
    } else {
      window.location.href = '/'
    }
  }
}

export interface ForgotPasswordResponse {
  success: true
  resetLink?: string
  mode?: 'email' | 'telegram_code'
  phone?: string
  expiresAt?: string
}

export async function forgotPassword(identifier: string): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email: identifier })
  return data
}

/** Verify by link token (e.g. from email link). */
export async function verifyEmailByLink(token: string): Promise<void> {
  await api.get('/auth/verify-email', { params: { token } })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword })
}

export async function resetPasswordWithTelegramCode(payload: {
  phone: string
  code: string
  newPassword: string
}): Promise<void> {
  await api.post('/auth/reset-password/telegram-code', payload)
}

/** Set new password (for user with temp password from school counsellor). Clears mustChangePassword. */
export async function setPassword(newPassword: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/set-password', { newPassword })
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  useAuthStore.getState().setUser(data)
  const token = useAuthStore.getState().accessToken
  if (token) {
    saveAuth(data, token, getStoredRefreshToken())
  }
  return data
}

export async function updateProfile(patch: Partial<Pick<User, 'name' | 'phone' | 'socialLinks' | 'avatar' | 'notificationPreferences' | 'onboardingTutorialSeen'>>): Promise<User> {
  const { data } = await api.patch<User>('/auth/me', patch)
  useAuthStore.getState().setUser(data)
  const token = useAuthStore.getState().accessToken
  if (token) {
    saveAuth(data, token, getStoredRefreshToken())
  }
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/change-password', { currentPassword, newPassword })
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  saveAuth(data.user, data.accessToken, data.refreshToken ?? null)
  return data
}

export { getApiError }
