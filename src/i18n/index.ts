import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLngs, defaultNS, fallbackLng, namespaces, getInitialLanguage, type SupportedLng } from './config'
import { studentEn, commonEn, schoolEn } from './fallbackEn'
import { localPatches } from './localPatches'
import { supplementalPatches } from './supplementalPatches'
import { clearFallbackPhraseCaches, translateFallbackPhrase } from './fallbackPhraseTranslations'

/** Inline fallback when fetch returns empty (always works). */
const FALLBACK_EN: Record<string, object> = { student: studentEn, common: commonEn, school: schoolEn }

/** Namespaces needed for first paint (common nav + school sidebar + documents UI). Load rest in background. */
const CRITICAL_NS: readonly string[] = ['common', 'landing', 'student', 'school', 'documents']
const OTHER_NS = namespaces.filter((n) => !CRITICAL_NS.includes(n))
let localizedFallbacksInstalled = false
type TranslationFn = typeof i18n.t

function applyLocalPatches(lng: string) {
  for (const source of [localPatches, supplementalPatches] as const) {
    const patches = source[lng as keyof typeof source]
    if (!patches) continue
    for (const [ns, bundle] of Object.entries(patches)) {
      i18n.addResourceBundle(lng, ns, bundle, true, true)
    }
  }
  clearFallbackPhraseCaches()
}

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

function normalizeLanguage(value: string | readonly string[] | undefined | false | null): SupportedLng {
  const candidate = Array.isArray(value) ? value[0] : value
  const normalized = typeof candidate === 'string' ? candidate.split('-')[0].toLowerCase() : ''
  if (normalized === 'ru' || normalized === 'uz') return normalized
  return 'en'
}

function extractTranslationMeta(args: unknown[]): { defaultValue?: string; values: Record<string, unknown> } {
  const first = args[0]
  const second = args[1]

  if (typeof first === 'string') {
    return {
      defaultValue: first,
      values: second && typeof second === 'object' && !Array.isArray(second) ? second as Record<string, unknown> : {},
    }
  }

  if (first && typeof first === 'object' && !Array.isArray(first)) {
    const values = first as Record<string, unknown>
    return {
      defaultValue: typeof values.defaultValue === 'string' ? values.defaultValue : undefined,
      values,
    }
  }

  return { values: {} }
}

function installLocalizedFallbacks() {
  if (localizedFallbacksInstalled) return
  localizedFallbacksInstalled = true

  const originalGetFixedT = i18n.getFixedT.bind(i18n)
  const originalT = i18n.t.bind(i18n)

  const wrapT = (
    baseT: TranslationFn,
    englishT: TranslationFn,
    context: { lng?: string | readonly string[] | false; ns?: string | readonly string[]; keyPrefix?: string }
  ): TranslationFn => {
    return ((key: unknown, ...rest: unknown[]) => {
      const result = baseT(key as never, ...(rest as never[]))
      if (typeof result !== 'string') return result

      const currentLng = normalizeLanguage(context.lng || i18n.resolvedLanguage || i18n.language)
      if (currentLng === 'en' || typeof key !== 'string') return result

      const { defaultValue, values } = extractTranslationMeta(rest)
      const existsInCurrentLanguage = i18n.exists(key, {
        lng: currentLng,
        ns: context.ns,
        keyPrefix: context.keyPrefix,
      })
      if (existsInCurrentLanguage) return result

      const englishSource =
        defaultValue ||
        englishT(key as never, ...(rest as never[]))

      if (typeof englishSource !== 'string' || !englishSource.trim()) return result

      return translateFallbackPhrase(i18n, englishSource, currentLng, values) ?? result
    }) as TranslationFn
  }

  i18n.getFixedT = ((lng: any, ns: any, keyPrefix: any) => {
    const fixedT = originalGetFixedT(lng, ns, keyPrefix)
    const englishT = originalGetFixedT('en', ns, keyPrefix)
    return wrapT(fixedT, englishT, { lng, ns, keyPrefix })
  }) as typeof i18n.getFixedT

  const englishBaseT = originalGetFixedT('en')
  i18n.t = ((key: unknown, ...rest: unknown[]) => {
    const baseT = originalT as TranslationFn
    return wrapT(baseT, englishBaseT, {
      lng: i18n.resolvedLanguage || i18n.language,
      ns: typeof rest[0] === 'object' && rest[0] !== null && !Array.isArray(rest[0]) && typeof (rest[0] as Record<string, unknown>).ns === 'string'
        ? (rest[0] as Record<string, unknown>).ns as string
        : undefined,
    })(key, ...rest)
  }) as typeof i18n.t
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
  applyLocalPatches(lng)
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

  // Preload English so fallbackLng has resources (e.g. student profile in EN when current is ru/uz)
  if (initialLng !== fallbackLng) {
    const enCritical = await loadNamespaces(fallbackLng, CRITICAL_NS)
    resourcesMap[fallbackLng] = { ...enCritical }
    for (const ns of OTHER_NS) {
      resourcesMap[fallbackLng][ns] = {}
    }
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
  installLocalizedFallbacks()
  applyLocalPatches(initialLng)
  if (initialLng !== fallbackLng) applyLocalPatches(fallbackLng)
  loadedLanguages.add(initialLng)
  if (initialLng !== fallbackLng) loadedLanguages.add(fallbackLng)
  try {
    localStorage.setItem('i18nextLng', initialLng)
  } catch {
    /* ignore */
  }
  // Load remaining namespaces in background (non-blocking).
  loadNamespaces(initialLng, OTHER_NS).then((otherRes) => {
    OTHER_NS.forEach((ns) => i18n.addResourceBundle(initialLng, ns, otherRes[ns], true))
    applyLocalPatches(initialLng)
  })
  if (initialLng !== fallbackLng) {
    loadNamespaces(fallbackLng, OTHER_NS).then((otherRes) => {
      OTHER_NS.forEach((ns) => i18n.addResourceBundle(fallbackLng, ns, otherRes[ns], true))
      applyLocalPatches(fallbackLng)
    })
  }
  return i18n
}

export default i18n
