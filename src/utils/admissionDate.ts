/** Legacy records may not include a timestamp; never let one row crash the staff workspace. */
export function formatAdmissionDate(value: unknown, locale: string, timeOnly = false): string {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) return '—'
  if (typeof value === 'string' && !value.trim()) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, timeOnly
    ? { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' }
    : { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tashkent' }).format(date)
}
