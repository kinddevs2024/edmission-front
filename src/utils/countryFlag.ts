import iso3166 from '@/data/iso3166-slim-2.json'

type IsoRow = { name: string; 'alpha-2': string }

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'US',
  'united states': 'US',
  uk: 'GB',
  'united kingdom': 'GB',
  uae: 'AE',
  'united arab emirates': 'AE',
  russia: 'RU',
  turkey: 'TR',
  'south korea': 'KR',
  korea: 'KR',
}
const COUNTRY_CODE_BY_NAME = new Map(
  (iso3166 as IsoRow[]).map((row) => [row.name.trim().toLocaleLowerCase('en-US'), row['alpha-2'].toUpperCase()]),
)

export function getCountryCode(country: string): string {
  const value = country.trim()
  if (/^[a-z]{2}$/i.test(value)) return value.toUpperCase()
  const normalized = value.toLocaleLowerCase('en-US')
  return COUNTRY_ALIASES[normalized] ?? COUNTRY_CODE_BY_NAME.get(normalized) ?? ''
}

export function getCountryFlagUrl(country: string): string {
  const code = getCountryCode(country)
  return code ? `https://flagcdn.com/w80/${code.toLocaleLowerCase('en-US')}.png` : ''
}
