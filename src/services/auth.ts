import { api, getApiError } from './api'
import type { User, LoginResponse } from '@/types/user'
import { useAuthStore } from '@/store/authStore'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  name: string
  role: 'student' | 'university'
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  return data
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register', {
    email: payload.email,
    password: payload.password,
    name: payload.name,
    role: payload.role,
  })
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  return data
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    useAuthStore.getState().logout()
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
}

export async function verifyEmail(token: string): Promise<void> {
  await api.get('/auth/verify-email', { params: { token } })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword })
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  useAuthStore.getState().setUser(data)
  return data
}

export async function updateProfile(patch: Partial<Pick<User, 'name' | 'avatar'>>): Promise<User> {
  const { data } = await api.patch<User>('/auth/me', patch)
  useAuthStore.getState().setUser(data)
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword })
}

export { getApiError }
