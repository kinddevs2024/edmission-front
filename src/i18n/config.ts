export const supportedLngs = ['en', 'ru', 'uz'] as const
export type SupportedLng = (typeof supportedLngs)[number]

export const defaultNS = 'common'
export const fallbackLng = 'en'

export const namespaces = ['common', 'auth', 'landing', 'student', 'university', 'admin', 'errors', 'chat'] as const

const STORAGE_KEY = 'i18nextLng'

/** Returns browser-preferred language if supported; otherwise fallback. */
export function getBrowserPreferredLanguage(): SupportedLng {
  if (typeof navigator === 'undefined') return fallbackLng
  const preferred = navigator.language || (navigator.languages && navigator.languages[0]) || ''
  const code = preferred.split('-')[0].toLowerCase()
  if (supportedLngs.includes(code as SupportedLng)) return code as SupportedLng
  for (const lang of navigator.languages || []) {
    const c = lang.split('-')[0].toLowerCase()
    if (supportedLngs.includes(c as SupportedLng)) return c as SupportedLng
  }
  return fallbackLng
}

/** Initial language: saved choice or browser preference. */
export function getInitialLanguage(): SupportedLng {
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
