import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLngs, defaultNS, fallbackLng, namespaces, getInitialLanguage } from './config'
import { studentEn, commonEn } from './fallbackEn'

/** Inline fallback when fetch returns empty (always works). */
const FALLBACK_EN: Record<string, object> = { student: studentEn, common: commonEn }

/** Namespaces needed for first paint (landing + common + student for sidebar). Load rest in background. */
const CRITICAL_NS: readonly string[] = ['common', 'landing', 'student']
const OTHER_NS = namespaces.filter((n) => !CRITICAL_NS.includes(n))

function getLocalesBaseUrl(): string {
  if (typeof window === 'undefined') return ''
  const base = import.meta.env.BASE_URL || '/'
  const origin = window.location.origin
  const path = base.endsWith('/') ? `${base}locales` : `${base}/locales`
  return `${origin}${path}`
}

async function loadNamespaces(lng: string, nsList: readonly string[]): Promise<Record<string, object>> {
  const baseUrl = getLocalesBaseUrl()
  const out: Record<string, object> = {}
  await Promise.all(
    nsList.map(async (ns) => {
      try {
        const url = baseUrl ? `${baseUrl}/${lng}/${ns}.json` : `/locales/${lng}/${ns}.json`
        const r = await fetch(url, { cache: 'no-cache' })
        const data = r.ok ? await r.json() : null
        const loaded = data && typeof data === 'object' && Object.keys(data).length > 0 ? data : {}
        out[ns] = Object.keys(loaded).length > 0 ? loaded : (lng === 'en' && FALLBACK_EN[ns] ? FALLBACK_EN[ns] : {})
      } catch {
        out[ns] = lng === 'en' && FALLBACK_EN[ns] ? FALLBACK_EN[ns] : {}
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
