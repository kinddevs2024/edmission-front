import { api } from './api'

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')

const apiOrigin = baseURL.replace(/\/api\/?$/, '') || (typeof window !== 'undefined' ? window.location.origin : '')

/** Default avatar when student has not set a photo (path from public). */
export const DEFAULT_STUDENT_AVATAR = '/default-student-avatar.svg'

/** Resolve image URL for preview/display (backend often returns path like /api/uploads/...). */
export function getImageUrl(value: string | undefined | null): string {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:')) return value
  let path = value.startsWith('/') ? value : `/${value}`
  // Express serves files at /api/uploads; older data may store /uploads/... only
  if (path.startsWith('/uploads/') && !path.startsWith('/api/')) {
    path = `/api${path}`
  }
  return apiOrigin ? `${apiOrigin}${path}` : path
}

/** Avatar URL for student: custom avatar or default placeholder. */
export function getStudentAvatarUrl(avatarUrl: string | undefined | null): string {
  const trimmed = avatarUrl?.trim()
  return trimmed ? getImageUrl(trimmed) : DEFAULT_STUDENT_AVATAR
}

/**
 * Upload a file. Returns the full URL to the uploaded file (e.g. for avatar or portfolio work).
 * Requires authentication.
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ url: string }>('/upload', formData)
  return resolveUploadUrl(data?.url ?? '')
}

/**
 * Public avatar upload for registration (no auth required).
 */
export async function uploadAvatarForRegister(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ url: string }>('/upload/avatar', formData)
  return resolveUploadUrl(data?.url ?? '')
}

function resolveUploadUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = baseURL.replace(/\/api\/?$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
