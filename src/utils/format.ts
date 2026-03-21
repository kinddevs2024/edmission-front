function toValidDate(date: string | Date): Date | null {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(
  date: string | Date,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const parsed = toValidDate(date)
  if (!parsed) return '—'
  return new Intl.DateTimeFormat(locale, options).format(parsed)
}

export function formatDateTime(date: string | Date, locale: string = 'en'): string {
  const parsed = toValidDate(date)
  if (!parsed) return '—'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed)
}

export function formatNumber(value: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatCurrency(value: number, currency: string = 'USD', locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

export function formatPercent(value: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value / 100)
}

export function daysUntil(date: string): number {
  const d = toValidDate(date)
  if (!d) return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
