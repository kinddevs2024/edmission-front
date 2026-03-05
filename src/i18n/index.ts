import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLngs, defaultNS, fallbackLng, namespaces, getInitialLanguage } from './config'

/** Load all namespaces for one language (8 requests in parallel). */
async function loadLanguageResources(lng: string): Promise<Record<string, object>> {
  const out: Record<string, object> = {}
  await Promise.all(
    namespaces.map(async (ns) => {
      try {
        const r = await fetch(`/locales/${lng}/${ns}.json`)
        out[ns] = r.ok ? await r.json() : {}
      } catch {
        out[ns] = {}
      }
    })
  )
  return out
}

const loadedLanguages = new Set<string>()

/** Load a language's namespaces if not yet loaded (for language switch). */
export async function loadLanguage(lng: string): Promise<void> {
  if (loadedLanguages.has(lng)) return
  const resources = await loadLanguageResources(lng)
  namespaces.forEach((ns) => {
    i18n.addResourceBundle(lng, ns, resources[ns], true)
  })
  loadedLanguages.add(lng)
}

export async function initI18n() {
  const initialLng = getInitialLanguage()
  // Load only initial language so the app can render quickly (8 requests instead of 24).
  const resources = await loadLanguageResources(initialLng)
  loadedLanguages.add(initialLng)

  const resourcesMap: Record<string, Record<string, object>> = { [initialLng]: resources }

  await i18n.use(initReactI18next).init({
    resources: resourcesMap,
    lng: initialLng,
    fallbackLng,
    defaultNS,
    ns: [...namespaces],
    supportedLngs: [...supportedLngs],
    interpolation: { escapeValue: false },
  })
  try {
    localStorage.setItem('i18nextLng', initialLng)
  } catch {
    /* ignore */
  }
  return i18n
}

export default i18n
