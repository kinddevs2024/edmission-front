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

const COUNTRY_NAME_CODES: Record<string, string> = {
  USA: 'US',
  'United States': 'US',
  UK: 'GB',
  'United Kingdom': 'GB',
  Germany: 'DE',
  Netherlands: 'NL',
  Uzbekistan: 'UZ',
  Russia: 'RU',
  Kazakhstan: 'KZ',
  Turkey: 'TR',
  Canada: 'CA',
  Australia: 'AU',
  Tajikistan: 'TJ',
  Kyrgyzstan: 'KG',
  Turkmenistan: 'TM',
  UAE: 'AE',
  'United Arab Emirates': 'AE',
  China: 'CN',
}

function normalizeLocale(locale?: string): string {
  return (locale || 'en').split('-')[0].toLowerCase()
}

export function getLocalizedCountryName(codeOrName: string, locale?: string): string {
  const value = codeOrName.trim()
  const regionCode = /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : COUNTRY_NAME_CODES[value]
  if (!regionCode) return codeOrName

  try {
    return new Intl.DisplayNames([normalizeLocale(locale)], { type: 'region' }).of(regionCode) ?? codeOrName
  } catch {
    return codeOrName
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
