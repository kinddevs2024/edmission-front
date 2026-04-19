/**
 * Canonical English labels for profile country pickers (residence, study preferences, school history).
 * Merges API-derived names with a small curated fallback and removes duplicates like GERMANY / ГЕРМАНИЯ.
 */

const ALIASES: Record<string, string> = {
  usa: 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  us: 'United States',
  uk: 'United Kingdom',
  'great britain': 'United Kingdom',
  england: 'United Kingdom',
  uzbekistan: 'Uzbekistan',
  узбекистан: 'Uzbekistan',
  kazakhstan: 'Kazakhstan',
  казахстан: 'Kazakhstan',
  tajikistan: 'Tajikistan',
  таджикистан: 'Tajikistan',
  kyrgyzstan: 'Kyrgyzstan',
  кыргызстан: 'Kyrgyzstan',
  turkmenistan: 'Turkmenistan',
  туркменистан: 'Turkmenistan',
  turkey: 'Turkey',
  türkiye: 'Turkey',
  turkiye: 'Turkey',
  uae: 'UAE',
  'united arab emirates': 'UAE',
  china: 'China',
  китай: 'China',
  germany: 'Germany',
  германия: 'Germany',
  deutschland: 'Germany',
  lithuania: 'Lithuania',
  lithuanian: 'Lithuania',
  latvia: 'Latvia',
  latvian: 'Latvia',
  poland: 'Poland',
  france: 'France',
  italy: 'Italy',
  spain: 'Spain',
  netherlands: 'Netherlands',
  holland: 'Netherlands',
  russia: 'Russia',
  россия: 'Russia',
  japan: 'Japan',
  korea: 'South Korea',
  'south korea': 'South Korea',
  canada: 'Canada',
  australia: 'Australia',
  india: 'India',
  pakistan: 'Pakistan',
  iran: 'Iran',
  egypt: 'Egypt',
  saudi: 'Saudi Arabia',
  'saudi arabia': 'Saudi Arabia',
}

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => {
      if (!w) return w
      if (/^[A-Z]{2,}$/.test(w)) {
        return w.charAt(0) + w.slice(1).toLowerCase()
      }
      return w.charAt(0).toLocaleUpperCase('en-US') + w.slice(1).toLocaleLowerCase('en-US')
    })
    .join(' ')
}

export function normalizeCountryLabel(raw: unknown): string {
  const s0 = String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ')
  if (!s0) return ''
  const low = s0.toLowerCase()
  if (ALIASES[low]) return ALIASES[low]
  const collapsed = low.replace(/[.]/g, '')
  if (ALIASES[collapsed]) return ALIASES[collapsed]

  if (/^[A-ZА-ЯЁІҢҮӨҺҒҚҰҮІ\s-]{2,}$/u.test(s0) && s0 === s0.toUpperCase()) {
    return titleCaseWords(s0)
  }

  return titleCaseWords(s0)
}

export function mergeCountryOptionLabels(fallbackLabels: readonly string[], fromApi: readonly string[]): string[] {
  const map = new Map<string, string>()
  for (const x of fallbackLabels) {
    const n = normalizeCountryLabel(x)
    if (n) map.set(n.toLowerCase(), n)
  }
  for (const x of fromApi) {
    const n = normalizeCountryLabel(x)
    if (n) map.set(n.toLowerCase(), n)
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, 'en'))
}

/** Collapse duplicates (e.g. Germany / ГЕРМАНИЯ) after normalization. */
export function dedupeNormalizedCountries(raw: readonly string[]): string[] {
  const map = new Map<string, string>()
  for (const x of raw) {
    const n = normalizeCountryLabel(x)
    if (n) map.set(n.toLowerCase(), n)
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, 'en'))
}
