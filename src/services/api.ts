import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { saveAuth, clearAuth } from './authPersistence'
import { getActAsUniversityUserId } from '@/constants/actAsUniversity'
import { getInitialLanguage, getSavedLanguageIfSupported, supportedLngs } from '@/i18n/config'

// Локально (dev): запросы сразу на бэкенд (порт 4000), без прокси. На проде — тот же домен /api (проксирует nginx).
const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

function isAuthEndpoint(url: string | undefined, endpoint: string): boolean {
  return (url ?? '').toLowerCase().includes(endpoint)
}

function isAuthAttemptEndpoint(url: string | undefined): boolean {
  const normalized = (url ?? '').toLowerCase()
  return [
    '/auth/login',
    '/auth/login-phone',
    '/auth/google',
    '/auth/yandex',
    '/auth/yandex/access-token',
    '/auth/apple',
    '/auth/telegram/verify',
    '/auth/telegram/verify-link',
    '/auth/telegram/verify-ready',
    '/auth/phone/verify',
  ].some((endpoint) => normalized.includes(endpoint))
}

function clearAuthSessionOnly(): void {
  clearAuth()
  useAuthStore.getState().logout()
}

function isNativeShell(): boolean {
  return Boolean((window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView)
}

function forceLogout(): void {
  clearAuthSessionOnly()
  if (isNativeShell()) return
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  const user = useAuthStore.getState().user
  const savedLanguage = getSavedLanguageIfSupported() ?? getInitialLanguage()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (supportedLngs.includes(savedLanguage)) {
    ;(config.headers as Record<string, string>)['X-User-Language'] = savedLanguage
  }
  if ((user?.role === 'university_multi_manager' || user?.role === 'multi_university_admin') && config.headers) {
    const actAs = getActAsUniversityUserId()
    if (actAs) {
      ;(config.headers as Record<string, string>)['X-Act-As-University'] = actAs
    }
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    const isRefreshRequest = isAuthEndpoint(originalRequest?.url, '/auth/refresh')
    const isLogoutRequest = isAuthEndpoint(originalRequest?.url, '/auth/logout')
    const isMobileWebAuthExchangeRequest = isAuthEndpoint(originalRequest?.url, '/auth/mobile-web/exchange')
    const isAuthAttemptRequest = isAuthAttemptEndpoint(originalRequest?.url)
    if (error.response?.status === 401) {
      if (isAuthAttemptRequest) {
        return Promise.reject(error)
      }
      if (isMobileWebAuthExchangeRequest) {
        return Promise.reject(error)
      }
      /** `POST /auth/logout` is followed by `logout()` in auth.ts, which navigates. Avoid a second redirect here (e.g. /login then /) which flashes the login page. */
      if (isLogoutRequest) {
        clearAuthSessionOnly()
        return Promise.reject(error)
      }
      if (!originalRequest || isRefreshRequest || originalRequest._retry) {
        forceLogout()
        return Promise.reject(error)
      }

      originalRequest._retry = true
      try {
        const { data } = await api.post<{ user: import('@/types/user').User; accessToken: string }>('/auth/refresh')
        saveAuth(data.user, data.accessToken)
        useAuthStore.getState().setAuth(data.user, data.accessToken)
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        /* fall through to clear and redirect */
      }
      forceLogout()
      return Promise.reject(error)
    }
    if (error.response?.status === 503) {
      const data = error.response.data as { code?: string }
      if (data?.code === 'MAINTENANCE') {
        window.location.href = '/maintenance'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export function getApiError(error: unknown): { message: string; errors?: Record<string, string[]> } {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string; errors?: Record<string, string[]> }
    return {
      message: data.message ?? 'An error occurred',
      errors: data.errors,
    }
  }
  return { message: error instanceof Error ? error.message : 'Unknown error' }
}
