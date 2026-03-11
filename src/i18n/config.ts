export const supportedLngs = ['en', 'ru', 'uz'] as const
export type SupportedLng = (typeof supportedLngs)[number]

export const defaultNS = 'common'
export const fallbackLng = 'en'

export const namespaces = ['common', 'auth', 'landing', 'cookies', 'student', 'university', 'admin', 'school', 'errors', 'chat'] as const

export const STORAGE_KEY = 'i18nextLng'

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

/** Browser's primary language code (e.g. 'en', 'ru', 'uz', 'de'). */
export function getBrowserLanguageCode(): string {
  if (typeof navigator === 'undefined') return ''
  const preferred = navigator.language || (navigator.languages && navigator.languages[0]) || ''
  return preferred.split('-')[0].toLowerCase()
}

/** True if browser's primary language is one of our supported (uz, en, ru). */
export function isBrowserLanguageSupported(): boolean {
  const code = getBrowserLanguageCode()
  return code === 'en' || code === 'ru' || code === 'uz'
}

/** Returns browser-preferred language if supported; otherwise fallback. */
export function getBrowserPreferredLanguage(): SupportedLng {
  const code = getBrowserLanguageCode()
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
