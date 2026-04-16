import i18n, { loadLanguage } from '@/i18n'
import {
  getFirstSupportedNavigatorLanguage,
  getSavedLanguageIfSupported,
  STORAGE_KEY,
  type SupportedLng,
} from '@/i18n/config'

/**
 * If the user has not saved a language but the browser lists a supported language (en/ru/uz),
 * apply it and persist — same outcome as if they picked it once on the landing.
 */
export async function applyInferredLanguageFromNavigatorIfNeeded(): Promise<SupportedLng | null> {
  if (getSavedLanguageIfSupported()) return null
  const lng = getFirstSupportedNavigatorLanguage()
  if (!lng) return null
  await loadLanguage(lng)
  await i18n.changeLanguage(lng)
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* ignore */
  }
  return lng
}
