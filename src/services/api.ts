import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

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
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      // TODO: call refresh token endpoint, then retry originalRequest
      useAuthStore.getState().logout()
      window.location.href = '/login'
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
