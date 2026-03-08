import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLngs, defaultNS, fallbackLng, namespaces, getInitialLanguage } from './config'

/** Namespaces needed for first paint (landing + common). Load rest in background. */
const CRITICAL_NS: readonly string[] = ['common', 'landing']
const OTHER_NS = namespaces.filter((n) => !CRITICAL_NS.includes(n))

async function loadNamespaces(lng: string, nsList: readonly string[]): Promise<Record<string, object>> {
  const out: Record<string, object> = {}
  await Promise.all(
    nsList.map(async (ns) => {
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

/** Load all namespaces for one language. */
async function loadLanguageResources(lng: string): Promise<Record<string, object>> {
  return loadNamespaces(lng, namespaces)
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
  // Load only critical namespaces (common + landing) for first paint, then load rest in background.
  const criticalRes = await loadNamespaces(initialLng, CRITICAL_NS)
  const resourcesMap: Record<string, Record<string, object>> = { [initialLng]: { ...criticalRes } }
  // Add empty placeholders for other NS so t() doesn't break; they'll be filled async.
  for (const ns of OTHER_NS) {
    resourcesMap[initialLng][ns] = {}
  }

  await i18n.use(initReactI18next).init({
    resources: resourcesMap,
    lng: initialLng,
    fallbackLng,
    defaultNS,
    ns: [...namespaces],
    supportedLngs: [...supportedLngs],
    interpolation: { escapeValue: false },
  })
  loadedLanguages.add(initialLng)
  try {
    localStorage.setItem('i18nextLng', initialLng)
  } catch {
    /* ignore */
  }
  // Load remaining namespaces in background (non-blocking).
  loadNamespaces(initialLng, OTHER_NS).then((otherRes) => {
    OTHER_NS.forEach((ns) => i18n.addResourceBundle(initialLng, ns, otherRes[ns], true))
  })
  return i18n
}

export default i18n
