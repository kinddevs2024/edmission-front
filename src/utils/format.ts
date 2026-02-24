export function formatDate(
  date: string | Date,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date))
}

export function formatDateTime(date: string | Date, locale: string = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
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
  const d = new Date(date)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
