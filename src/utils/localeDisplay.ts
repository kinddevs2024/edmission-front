const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Russian: 'ru',
  Uzbek: 'uz',
  Kazakh: 'kk',
  Turkish: 'tr',
  Chinese: 'zh',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Arabic: 'ar',
}

function normalizeLocale(locale?: string): string {
  return (locale || 'en').split('-')[0].toLowerCase()
}

export function getLocalizedCountryName(code: string, locale?: string): string {
  try {
    return new Intl.DisplayNames([normalizeLocale(locale)], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export function getLocalizedLanguageName(name: string, locale?: string): string {
  const code = LANGUAGE_CODES[name]
  if (!code) return name

  try {
    return new Intl.DisplayNames([normalizeLocale(locale)], { type: 'language' }).of(code) ?? name
  } catch {
    return name
  }
}
