import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'
import i18n from '@/i18n'
import { getStoredRefreshToken, saveAuth, clearAuth } from './authPersistence'

// Локально (dev): запросы сразу на бэкенд (порт 4000), без прокси. На проде — тот же домен /api (проксирует nginx).
const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0].toLowerCase()
  config.headers['Accept-Language'] = language
  config.headers['X-User-Language'] = language
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken()
      if (refreshToken) {
        originalRequest._retry = true
        try {
          const { data } = await api.post<{ user: import('@/types/user').User; accessToken: string }>('/auth/refresh', { refreshToken })
          saveAuth(data.user, data.accessToken, refreshToken)
          useAuthStore.getState().setAuth(data.user, data.accessToken)
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        } catch {
          /* fall through to clear and redirect */
        }
      }
      clearAuth()
      useAuthStore.getState().logout()
      window.location.href = '/login'
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
      message: data.message ?? i18n.t('common:error', 'Something went wrong'),
      errors: data.errors,
    }
  }
  return {
    message:
      error instanceof Error && error.message.trim()
        ? error.message
        : i18n.t('common:error', 'Something went wrong'),
  }
}
