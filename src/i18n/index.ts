import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLngs, defaultNS, fallbackLng, namespaces } from './config'

export async function initI18n() {
  const resources: Record<string, Record<string, object>> = {}
  for (const lng of supportedLngs) {
    resources[lng] = {}
    for (const ns of namespaces) {
      try {
        const r = await fetch(`/locales/${lng}/${ns}.json`)
        resources[lng][ns] = r.ok ? await r.json() : {}
      } catch {
        resources[lng][ns] = {}
      }
    }
  }
  await i18n.use(initReactI18next).init({
    resources,
    lng: fallbackLng,
    fallbackLng,
    defaultNS,
    ns: [...namespaces],
    supportedLngs: [...supportedLngs],
    interpolation: { escapeValue: false },
  })
  return i18n
}

export default i18n
