import { api } from './api'

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')

const apiOrigin = baseURL.replace(/\/api\/?$/, '') || (typeof window !== 'undefined' ? window.location.origin : '')

/** Default avatar when a user has not set a photo. */
export const DEFAULT_USER_AVATAR = 'https://img.icons8.com/lollipop/96/user.png'
export const DEFAULT_STUDENT_AVATAR = DEFAULT_USER_AVATAR

export const IPHONE_IMAGE_ACCEPT = 'image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs'
export const IMAGE_UPLOAD_ACCEPT = `image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,image/jfif,${IPHONE_IMAGE_ACCEPT}`
export const IMAGE_OR_PDF_UPLOAD_ACCEPT = `${IMAGE_UPLOAD_ACCEPT},application/pdf,.pdf`
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_UPLOAD_SIZE_MB = 10

export function assertMaxUploadSize(file: File): void {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`Maximum file size is ${MAX_UPLOAD_SIZE_MB} MB.`)
  }
}

/** Resolve image URL for preview/display (backend often returns path like /api/uploads/...). */
export function getImageUrl(value: string | undefined | null): string {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:')) return value
  if (value.startsWith('/logo/') || value.startsWith('/landing/') || value.startsWith('/favicon')) return value
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
  assertMaxUploadSize(file)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ url: string }>('/upload', formData)
  return resolveUploadUrl(data?.url ?? '')
}

/**
 * Public avatar upload for registration (no auth required).
 */
export async function uploadAvatarForRegister(file: File): Promise<string> {
  assertMaxUploadSize(file)
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
