import { api } from '@/services/api'

type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

function getApiOrigin(): string {
  const baseURL = String(api.defaults.baseURL ?? '').trim()
  if (/^https?:\/\//i.test(baseURL)) {
    return baseURL.replace(/\/api\/?$/i, '')
  }
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

function buildShareUrl(path: string): string {
  const origin = getApiOrigin()
  if (!origin) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalizedPath}`
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to legacy copy
    }
  }

  if (typeof document === 'undefined') return false
  try {
    const input = document.createElement('textarea')
    input.value = text
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    input.style.pointerEvents = 'none'
    document.body.appendChild(input)
    input.focus()
    input.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(input)
    return ok
  } catch {
    return false
  }
}

export function buildUniversityShareLink(universityId: string): string {
  return buildShareUrl(`/api/public/share/university/${encodeURIComponent(universityId)}`)
}

export function buildStudentShareLink(studentId: string): string {
  return buildShareUrl(`/api/public/share/student/${encodeURIComponent(studentId)}`)
}

export async function shareAccountLink(input: {
  title: string
  url: string
  text?: string
}): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: input.title,
        text: input.text,
        url: input.url,
      })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  const copied = await copyText(input.url)
  return copied ? 'copied' : 'failed'
}

