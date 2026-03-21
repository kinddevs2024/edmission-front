import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLngs, defaultNS, fallbackLng, namespaces, getInitialLanguage } from './config'
import { studentEn, commonEn, schoolEn } from './fallbackEn'

/** Inline fallback when fetch returns empty (always works). */
const FALLBACK_EN: Record<string, object> = { student: studentEn, common: commonEn, school: schoolEn }
const LOCALE_PATCHES: Record<string, Record<string, Record<string, string>>> = {
  ru: {
    common: {
      noConversationsYet: 'Пока нет диалогов.',
      trialEnds: 'Пробный период до',
      subscriptionSupportHint: 'Нужна помощь? Обратитесь в поддержку по вопросам тарифа и оплаты.',
      contactSupport: 'Связаться с поддержкой',
      unsavedChanges: 'У вас есть несохраненные изменения. Закрыть без сохранения?',
    },
    student: {
      preferredCountries: 'Предпочтительные страны',
      preferredCountriesHint: 'Где вы хотите учиться?',
      preferredCountriesPlaceholder: 'Выберите страны',
      profileMatchingOn: 'Сопоставление профиля включено',
      profileMatchingOff: 'Сопоставление профиля выключено',
      fullFilter: 'Полный фильтр',
      fullUniversityFilterHint:
        'Найдите университет по названию, стране, факультету, уровню образования, языку программы, стоимости, требованиям, году основания, количеству студентов, стипендиям и целевым странам.',
      filterBudgetScale: 'Стоимость и масштаб',
      filterBudgetScaleHint:
        'Сузьте поиск по стоимости обучения, году основания и размеру университета.',
      minTuition: 'Мин. стоимость',
      maxTuition: 'Макс. стоимость',
      foundedYearFrom: 'Год основания от',
      foundedYearTo: 'Год основания до',
      studentCountFrom: 'Студентов от',
      studentCountTo: 'Студентов до',
      matchingScope: 'Параметры совпадения',
      matchingScopeHint:
        'Выберите, применять ли значения из вашего профиля как дополнительный слой фильтрации.',
      alsoApplyProfileDefaults: 'Также применять настройки профиля',
      profileDefaultsHint:
        'Когда включено, каталог также учитывает ваши предпочтительные страны и выбранные факультеты, если вы не переопределили их выше.',
      matchLabel: '{{score}}% совпадение',
    },
  },
  uz: {
    common: {
      noConversationsYet: "Hozircha suhbatlar yo'q.",
      trialEnds: 'Sinov muddati',
      subscriptionSupportHint: "Yordam kerakmi? Tarif va to'lov bo'yicha qo'llab-quvvatlashga murojaat qiling.",
      contactSupport: "Qo'llab-quvvatlash bilan bog'lanish",
      unsavedChanges: "Saqlanmagan o'zgarishlar bor. Saqlamasdan yopilsinmi?",
    },
    student: {
      preferredCountries: 'Afzal mamlakatlar',
      preferredCountriesHint: "Qayerda o'qishni xohlaysiz?",
      preferredCountriesPlaceholder: 'Mamlakatlarni tanlang',
      profileMatchingOn: 'Profil mosligi yoqilgan',
      profileMatchingOff: "Profil mosligi o'chirilgan",
      fullFilter: "To'liq filtr",
      fullUniversityFilterHint:
        "Universitetni nomi, mamlakati, fakulteti, daraja turi, dastur tili, kontrakt narxi, talablar, tashkil topgan yili, talabalar soni, stipendiyalar va maqsadli mamlakatlar bo'yicha toping.",
      filterBudgetScale: "Narx va ko'lam",
      filterBudgetScaleHint:
        "Kontrakt oralig'i, tashkil topgan yil va universitet hajmi bo'yicha natijalarni toraytiring.",
      minTuition: 'Eng kam kontrakt',
      maxTuition: "Eng ko'p kontrakt",
      foundedYearFrom: "Tashkil topgan yil (dan)",
      foundedYearTo: "Tashkil topgan yil (gacha)",
      studentCountFrom: 'Talabalar soni (dan)',
      studentCountTo: 'Talabalar soni (gacha)',
      matchingScope: 'Moslik qamrovi',
      matchingScopeHint:
        "Profilingizdagi standart qiymatlarni qo'shimcha filtr sifatida qo'llashni tanlang.",
      alsoApplyProfileDefaults: 'Profilimdagi standartlarni ham qo‘llash',
      profileDefaultsHint:
        "Yoqilganida, katalog yuqorida alohida o'zgartirmasangiz, afzal mamlakatlaringiz va qiziqqan fakultetlaringizni ham hisobga oladi.",
      matchLabel: '{{score}}% moslik',
    },
  },
}

/** Namespaces needed for first paint (common nav + school sidebar + documents UI). Load rest in background. */
const CRITICAL_NS: readonly string[] = ['common', 'landing', 'student', 'school', 'documents']
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

function applyLocalePatches(lng: string, resources: Record<string, object>): Record<string, object> {
  const patchByNs = LOCALE_PATCHES[lng]
  if (!patchByNs) return resources
  const next = { ...resources }
  for (const [ns, patch] of Object.entries(patchByNs)) {
    next[ns] = { ...(next[ns] as Record<string, unknown> | undefined), ...patch }
  }
  return next
}

/** Load all namespaces for one language. */
async function loadLanguageResources(lng: string): Promise<Record<string, object>> {
  return loadNamespaces(lng, namespaces)
}

const loadedLanguages = new Set<string>()

/** Load a language's namespaces if not yet loaded (for language switch). */
export async function loadLanguage(lng: string): Promise<void> {
  if (loadedLanguages.has(lng)) return
  const resources = applyLocalePatches(lng, await loadLanguageResources(lng))
  namespaces.forEach((ns) => {
    i18n.addResourceBundle(lng, ns, resources[ns], true)
  })
  loadedLanguages.add(lng)
}

export async function initI18n() {
  const initialLng = getInitialLanguage()
  // Load only critical namespaces (common + landing) for first paint, then load rest in background.
  const criticalRes = applyLocalePatches(initialLng, await loadNamespaces(initialLng, CRITICAL_NS))
  const resourcesMap: Record<string, Record<string, object>> = { [initialLng]: { ...criticalRes } }
  // Add empty placeholders for other NS so t() doesn't break; they'll be filled async.
  for (const ns of OTHER_NS) {
    resourcesMap[initialLng][ns] = {}
  }

  // Preload English so fallbackLng has resources (e.g. student profile in EN when current is ru/uz)
  if (initialLng !== fallbackLng) {
    const enCritical = applyLocalePatches(fallbackLng, await loadNamespaces(fallbackLng, CRITICAL_NS))
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
  loadedLanguages.add(initialLng)
  if (initialLng !== fallbackLng) loadedLanguages.add(fallbackLng)
  try {
    localStorage.setItem('i18nextLng', initialLng)
  } catch {
    /* ignore */
  }
  // Load remaining namespaces in background (non-blocking).
  loadNamespaces(initialLng, OTHER_NS).then((otherRes) => {
    const patchedRes = applyLocalePatches(initialLng, otherRes)
    OTHER_NS.forEach((ns) => i18n.addResourceBundle(initialLng, ns, patchedRes[ns], true))
  })
  if (initialLng !== fallbackLng) {
    loadNamespaces(fallbackLng, OTHER_NS).then((otherRes) => {
      const patchedRes = applyLocalePatches(fallbackLng, otherRes)
      OTHER_NS.forEach((ns) => i18n.addResourceBundle(fallbackLng, ns, patchedRes[ns], true))
    })
  }
  return i18n
}

export default i18n
