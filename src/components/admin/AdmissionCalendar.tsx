import { useEffect, useMemo, useState } from 'react'
import { admissions, type AdmissionBooking } from '@/services/admissions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ADMISSION_DAY, admissionWeekLayout, admissionWeekStart, allAdmissionBookingPages } from '@/utils/admissionCalendar'
import { formatAdmissionDate } from '@/utils/admissionDate'

const copy = {
  ru: { previous: 'Предыдущая неделя', next: 'Следующая неделя', today: 'Сегодня', loading: 'Загрузка календаря…', error: 'Не удалось загрузить календарь', retry: 'Повторить', time: 'Время Ташкента · Только подтверждённые записи', empty: 'На этой неделе записей нет', unknown: 'Записи без корректного времени', unnamed: 'Без имени', title: 'Календарь консультаций', profile: 'Открыть профиль и переписку' },
  en: { previous: 'Previous week', next: 'Next week', today: 'Today', loading: 'Loading calendar…', error: 'Could not load calendar', retry: 'Retry', time: 'Tashkent time · Confirmed bookings only', empty: 'No bookings this week', unknown: 'Bookings without a valid time', unnamed: 'No name', title: 'Consultation calendar', profile: 'Open profile and conversation' },
  uz: { previous: 'Oldingi hafta', next: 'Keyingi hafta', today: 'Bugun', loading: 'Kalendar yuklanmoqda…', error: 'Kalendar yuklanmadi', retry: 'Qayta urinish', time: 'Toshkent vaqti · Faqat tasdiqlangan yozuvlar', empty: 'Bu haftada yozuvlar yo‘q', unknown: 'Vaqti aniqlanmagan yozuvlar', unnamed: 'Ismsiz', title: 'Maslahatlar kalendari', profile: 'Profil va suhbatni ochish' },
}
const HOUR_HEIGHT = 72
export function AdmissionCalendar({ locale, reload, openProfile }: { locale: keyof typeof copy; reload: number; openProfile: (id: string) => void }) {
  const l = copy[locale]
  const [week, setWeek] = useState(() => admissionWeekStart())
  const [bookings, setBookings] = useState<AdmissionBooking[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(false); setBookings([])
    allAdmissionBookingPages(page => admissions.bookings({ page, q: '', status: 'active' }, controller.signal))
      .then(rows => { if (!controller.signal.aborted) setBookings(rows) }).catch(() => { if (!controller.signal.aborted) setError(true) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [week, reload, retry])
  const layout = useMemo(() => admissionWeekLayout(bookings, week), [bookings, week])
  const dayLabel = (day: number) => new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Tashkent', weekday: 'short', day: 'numeric', month: 'short' }).format(week + day * ADMISSION_DAY)
  const hours = Array.from({ length: layout.lastHour - layout.firstHour }, (_, index) => layout.firstHour + index)
  const height = hours.length * HOUR_HEIGHT
  return <Card><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{l.title}</h2><p className="text-sm text-[var(--color-text-muted)]">{dayLabel(0)} – {dayLabel(6)}</p></div><div className="flex gap-2"><Button size="sm" variant="secondary" aria-label={l.previous} title={l.previous} onClick={() => setWeek(value => value - 7 * ADMISSION_DAY)}>←</Button><Button size="sm" variant="secondary" onClick={() => setWeek(admissionWeekStart())}>{l.today}</Button><Button size="sm" variant="secondary" aria-label={l.next} title={l.next} onClick={() => setWeek(value => value + 7 * ADMISSION_DAY)}>→</Button></div></div><p className="mb-3 text-xs text-[var(--color-text-muted)]">{l.time}</p>
    {loading ? <p role="status" className="py-8">{l.loading}</p> : error ? <div role="alert"><p>{l.error}</p><Button variant="secondary" className="mt-3" onClick={() => setRetry(value => value + 1)}>{l.retry}</Button></div> : <>
    {!layout.blocks.length && <p className="mb-3 text-sm">{l.empty}</p>}
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]" role="region" aria-label={l.title} tabIndex={0}><div className="min-w-[980px]"><div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-[var(--color-border)]"><div />{Array.from({ length: 7 }, (_, day) => <h3 key={day} className="border-l border-[var(--color-border)] p-3 text-center text-sm font-semibold">{dayLabel(day)}</h3>)}</div><div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]"><div style={{ height }} className="relative bg-[var(--color-card)]">{hours.map(hour => <span key={hour} className="absolute right-2 text-xs text-[var(--color-text-muted)]" style={{ top: (hour - layout.firstHour) * HOUR_HEIGHT + 4 }}>{String(hour).padStart(2, '0')}:00</span>)}<span className="absolute bottom-0 right-2 text-xs text-[var(--color-text-muted)]">{String(layout.lastHour).padStart(2, '0')}:00</span></div>{Array.from({ length: 7 }, (_, day) => <div key={day} className="relative border-l border-[var(--color-border)]" style={{ height, backgroundImage: 'linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)', backgroundSize: `100% ${HOUR_HEIGHT}px` }}>{layout.blocks.filter(block => block.day === day).map(block => {
      const lead = block.booking.leadId
      const text = `${lead?.name || lead?.username || l.unnamed} · ${formatAdmissionDate(block.booking.start, locale, true)}–${formatAdmissionDate(block.booking.end, locale, true)}`
      return <button type="button" key={block.booking._id + day} disabled={!lead?._id} aria-label={`${l.profile}: ${text}`} title={text} onClick={() => lead?._id && openProfile(lead._id)} className="absolute overflow-hidden rounded-md border border-lime-600/40 bg-lime-500/15 p-1.5 text-left text-[var(--color-text)] shadow-sm hover:bg-lime-500/25 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:cursor-default" style={{ top: (block.startHour - layout.firstHour) * HOUR_HEIGHT + 2, height: Math.max(22, (block.endHour - block.startHour) * HOUR_HEIGHT - 4), left: `calc(${block.lane / block.lanes * 100}% + 2px)`, width: `calc(${100 / block.lanes}% - 4px)` }}><span className="block text-xs font-semibold">{lead?.name || lead?.username || l.unnamed}</span><span className="block text-[11px]">{formatAdmissionDate(block.booking.start, locale, true)}–{formatAdmissionDate(block.booking.end, locale, true)}</span></button>
    })}</div>)}</div></div></div>
    {layout.invalid.length > 0 && <div className="mt-3"><h3 className="text-sm font-semibold">{l.unknown}</h3>{layout.invalid.map(booking => <Button key={booking._id} variant="ghost" size="sm" disabled={!booking.leadId?._id} onClick={() => booking.leadId?._id && openProfile(booking.leadId._id)}>{booking.leadId?.name || l.unnamed}</Button>)}</div>}
    </>}
  </Card>
}
