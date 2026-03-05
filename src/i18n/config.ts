export const supportedLngs = ['en', 'ru', 'uz'] as const
export type SupportedLng = (typeof supportedLngs)[number]

export const defaultNS = 'common'
export const fallbackLng = 'en'

export const namespaces = ['common', 'auth', 'landing', 'student', 'university', 'admin', 'errors', 'chat'] as const

const STORAGE_KEY = 'i18nextLng'

function fromUrlParam(): SupportedLng | null {
  if (typeof window === 'undefined') return null
  try {
    const url = new URL(window.location.href)
    const param = (url.searchParams.get('lang') || url.searchParams.get('lng') || '').toLowerCase()
    if (param === 'en' || param === 'ru' || param === 'uz') return param
  } catch {
    /* ignore */
  }
  return null
}

/** Returns browser-preferred language if supported; otherwise fallback. */
export function getBrowserPreferredLanguage(): SupportedLng {
  if (typeof navigator === 'undefined') return fallbackLng
  const preferred = navigator.language || (navigator.languages && navigator.languages[0]) || ''
  const code = preferred.split('-')[0].toLowerCase()
  // Product rule:
  // - Use browser default language only when it is RU or UZ.
  // - For any other browser language, always fall back to EN.
  if (code === 'ru') return 'ru'
  if (code === 'uz') return 'uz'
  return 'en'
}

/** Initial language: saved choice or browser preference. */
export function getInitialLanguage(): SupportedLng {
  const fromUrl = fromUrlParam()
  if (fromUrl) return fromUrl
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const code = saved.split('-')[0].toLowerCase()
      if (supportedLngs.includes(code as SupportedLng)) return code as SupportedLng
    }
  } catch {
    /* ignore */
  }
  return getBrowserPreferredLanguage()
}
