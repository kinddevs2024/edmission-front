import iso3166 from '@/data/iso3166-slim-2.json'

type Iso3166SlimRow = {
  name: string
  'alpha-2': string
}

let cachedLabels: string[] | null = null

/**
 * Full official English country/territory names from ISO 3166 (249+ entries via `iso3166-slim-2.json`),
 * plus Kosovo for common UX. These are what the university country `<Select>` shows — not ISO
 * reserved codes (AA, QM–QZ, ZZ, etc.), which are internal only and never appear in the UI.
 */
export function getWorldCountryLabelsSorted(): string[] {
  if (cachedLabels) return cachedLabels
  const rows = iso3166 as Iso3166SlimRow[]
  const set = new Set<string>()
  for (const row of rows) {
    const n = String(row.name ?? '').trim()
    if (n) set.add(n)
  }
  set.add('Kosovo')
  cachedLabels = [...set].sort((a, b) => a.localeCompare(b, 'en'))
  return cachedLabels
}
