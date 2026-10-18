import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { admissions, type AdmissionBooking, type AdmissionLead, type AdmissionMessage, type AdmissionQuestion } from '@/services/admissions'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Table'
import { formatAdmissionDate } from '@/utils/admissionDate'
import { AdmissionCalendar } from '@/components/admin/AdmissionCalendar'
import { cn } from '@/utils/cn'

type Section = 'bookings' | 'profiles' | 'questions' | 'calendar'
const labels = {
  ru: { title: 'ИИ-помощник', calendar: 'Календарь', bookings: 'Записи', profiles: 'Профили', questions: 'Вопросы', search: 'Поиск по имени, телефону или тексту', all: 'Все записи', active: 'Подтверждённые', cancelled: 'Отменённые', empty: 'Ничего не найдено', loading: 'Загрузка…', error: 'Не удалось загрузить данные. Попробуйте ещё раз.', forbidden: 'Этот раздел доступен только сотрудникам.', retry: 'Повторить', open: 'Профиль и переписка', close: 'Закрыть профиль', chat: 'Переписка с ИИ', older: 'Загрузить предыдущие сообщения', student: 'Ученик', ai: 'ИИ-помощник', bot: 'Бот', staff: 'Сотрудник', pending: 'Не доставлено', noChat: 'Сообщений пока нет', language: 'Язык общения', preferences: 'Пожелания к обучению', notes: 'Заметки', phone: 'Телефон', status: 'Статус', time: 'Время Ташкента', online: 'Онлайн', office: 'В офисе', noAnswer: 'Ответ пока не записан', summary: 'Краткая информация', website: 'Сайт', channel: 'Канал', username: 'Telegram', refresh: 'Обновить', changes: 'Изменения сообщения календаря', action: 'Действие в меню' },
  en: { title: 'AI Assistant', calendar: 'Calendar', bookings: 'Bookings', profiles: 'Profiles', questions: 'Questions', search: 'Search name, phone or message', all: 'All bookings', active: 'Confirmed', cancelled: 'Cancelled', empty: 'No results', loading: 'Loading…', error: 'Could not load data. Please try again.', forbidden: 'This section is available to staff only.', retry: 'Retry', open: 'Profile and conversation', close: 'Close profile', chat: 'AI conversation', older: 'Load earlier messages', student: 'Student', ai: 'AI assistant', bot: 'Bot', staff: 'Staff', pending: 'Not delivered', noChat: 'No messages yet', language: 'Conversation language', preferences: 'Study preferences', notes: 'Notes', phone: 'Phone', status: 'Status', time: 'Tashkent time', online: 'Online', office: 'In person', noAnswer: 'No answer recorded yet', summary: 'Summary', website: 'Website', channel: 'Channel', username: 'Telegram', refresh: 'Refresh', changes: 'Calendar message changes', action: 'Menu action' },
  uz: { title: 'AI yordamchi', calendar: 'Kalendar', bookings: 'Yozuvlar', profiles: 'Profillar', questions: 'Savollar', search: 'Ism, telefon yoki matn bo‘yicha qidirish', all: 'Barcha yozuvlar', active: 'Tasdiqlangan', cancelled: 'Bekor qilingan', empty: 'Hech narsa topilmadi', loading: 'Yuklanmoqda…', error: 'Ma’lumot yuklanmadi. Qayta urinib ko‘ring.', forbidden: 'Bu bo‘lim faqat xodimlar uchun.', retry: 'Qayta urinish', open: 'Profil va suhbat', close: 'Profilni yopish', chat: 'AI bilan suhbat', older: 'Oldingi xabarlarni yuklash', student: 'O‘quvchi', ai: 'AI yordamchi', bot: 'Bot', staff: 'Xodim', pending: 'Yetkazilmagan', noChat: 'Hozircha xabar yo‘q', language: 'Suhbat tili', preferences: 'Ta’lim istaklari', notes: 'Izohlar', phone: 'Telefon', status: 'Holat', time: 'Toshkent vaqti', online: 'Onlayn', office: 'Ofisda', noAnswer: 'Javob hali yozilmagan', summary: 'Qisqa ma’lumot', website: 'Sayt', channel: 'Kanal', username: 'Telegram', refresh: 'Yangilash', changes: 'Kalendar xabari o‘zgarishlari', action: 'Menyu amali' },
}
const profileLabels: Record<string, [string, string, string]> = {
 country: ['Страна', 'Country', 'Mamlakat'], destination: ['Страна обучения', 'Study destination', 'Ta’lim mamlakati'], degree: ['Степень', 'Degree', 'Daraja'], program: ['Направление', 'Program', 'Yo‘nalish'], language: ['Язык обучения', 'Study language', 'Ta’lim tili'], studyLanguage: ['Язык обучения', 'Study language', 'Ta’lim tili'], budget: ['Бюджет', 'Budget', 'Budjet'], intake: ['Начало обучения', 'Intake', 'Qabul muddati'], ielts: ['IELTS', 'IELTS', 'IELTS'], education: ['Образование', 'Education', 'Ma’lumot'], scholarship: ['Стипендия', 'Scholarship', 'Stipendiya'], readiness: ['Готовность к поступлению', 'Application readiness', 'Topshirishga tayyorlik'],
}
const statusLabels: Record<string, [string, string, string]> = {
 new: ['Новое обращение', 'New inquiry', 'Yangi murojaat'], qualified: ['Пожелания уточнены', 'Qualified lead', 'Istaklar aniqlandi'], consultation_booked: ['Консультация назначена', 'Consultation booked', 'Maslahat belgilangan'], consultation_completed: ['Консультация проведена', 'Consultation completed', 'Maslahat o‘tkazilgan'], considering: ['Выбирает варианты', 'Considering options', 'Variantlarni ko‘rib chiqmoqda'], application: ['Подаёт документы', 'Application in progress', 'Hujjat topshirmoqda'], offer: ['Получено приглашение', 'Offer received', 'Taklif olindi'], enrolled: ['Зачислен', 'Enrolled', 'Qabul qilingan'], not_interested: ['Не заинтересован', 'Not interested', 'Qiziqmaydi'], on_hold: ['Отложено', 'On hold', 'Kutilmoqda'], closed: ['Закрыто', 'Closed', 'Yopilgan'],
}
const localizedField = (key: string, locale: string) => profileLabels[key]?.[locale === 'ru' ? 0 : locale === 'en' ? 1 : 2] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
const leadChannel = (lead: AdmissionLead) => lead.channel || (lead.chatId?.startsWith('web:') ? 'website' : lead.username ? 'telegram' : '')
const displayValue = (value: unknown): string => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : Array.isArray(value) ? value.map(displayValue).filter(Boolean).join(', ') : ''

export function AdminAdmissions() {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('ru') ? 'ru' : i18n.language.startsWith('uz') ? 'uz' : 'en'
  const l = labels[locale]
  const date = (value: unknown) => formatAdmissionDate(value, locale)
  const [section, setSection] = useState<Section>('bookings')
  const [search, setSearch] = useState(''); const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all'); const [page, setPage] = useState(1)
  const [listSection, setListSection] = useState<Section>('bookings')
  const [items, setItems] = useState<(AdmissionBooking | AdmissionLead | AdmissionQuestion)[]>([])
  const [total, setTotal] = useState(0); const [limit, setLimit] = useState(50)
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1) }, 300); return () => clearTimeout(timer) }, [search])
  useEffect(() => {
    if (section === 'calendar') return
    const controller = new AbortController(); setLoading(true); setError(''); setItems([])
    const request = section === 'bookings' ? admissions.bookings({ page, q: query, status }, controller.signal) : section === 'profiles' ? admissions.leads({ page, q: query }, controller.signal) : admissions.questions({ page, q: query }, controller.signal)
    request.then(data => { if (!controller.signal.aborted) { setItems(data.items); setListSection(section); setTotal(data.total); setLimit(data.limit ?? 50) } }).catch(e => { if (!controller.signal.aborted) setError(e.response?.status === 403 ? 'forbidden' : 'error') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [section, query, status, page, reload])
  return <div className="space-y-4 pb-6">
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-semibold">{l.title}</h1><Button variant="secondary" size="sm" onClick={() => setReload(v => v + 1)}>{l.refresh}</Button></div>
    <nav aria-label={l.title} className="flex flex-wrap gap-2">{(['bookings', 'profiles', 'questions', 'calendar'] as const).map(tab => <Button key={tab} variant={section === tab ? 'primary' : 'secondary'} aria-pressed={section === tab} onClick={() => { setSection(tab); setPage(1); setSelected(null) }}>{l[tab]}</Button>)}</nav>
    {section === 'calendar' ? <AdmissionCalendar locale={locale} reload={reload} openProfile={setSelected} /> : <><Card><div className="grid gap-3 sm:grid-cols-[1fr_220px]"><Input aria-label={l.search} placeholder={l.search} value={search} onChange={e => setSearch(e.target.value)} />{section === 'bookings' && <Select aria-label={l.status} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} options={['all', 'active', 'cancelled'].map(value => ({ value, label: l[value as 'all' | 'active' | 'cancelled'] }))} />}</div><p className="mt-2 text-xs text-[var(--color-text-muted)]">{l.time}</p></Card>
    {error ? <Card><p role="alert">{l[error as 'error' | 'forbidden']}</p><Button variant="secondary" className="mt-3" onClick={() => setReload(v => v + 1)}>{l.retry}</Button></Card> : loading || listSection !== section ? <Card><p role="status">{l.loading}</p></Card> : !items.length ? <Card><p>{l.empty}</p></Card> : <div className="grid gap-3">{items.map(item => {
      const booking = section === 'bookings' ? item as AdmissionBooking : null
      const question = section === 'questions' ? item as AdmissionQuestion : null
      const lead = section === 'profiles' ? item as AdmissionLead : booking?.leadId ?? question?.leadId
      const slot = booking?.slot ?? (booking && typeof booking.slotId === 'object' ? booking.slotId : undefined)
      return <Card key={item._id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><CardTitle>{lead?.name || lead?.username || '—'}</CardTitle>{lead && <p className="text-xs text-[var(--color-text-muted)]">{leadChannel(lead) === 'website' ? l.website : leadChannel(lead) === 'telegram' ? 'Telegram' : ''}</p>}<p className="text-sm text-[var(--color-text-muted)]">{lead?.phone || '—'}{lead?.username ? ` · @${lead.username}` : ''}</p></div>{lead?._id && <Button size="sm" variant="secondary" onClick={() => setSelected(lead._id)}>{l.open}</Button>}</div>
      {booking && <div className="mt-3 space-y-1 text-sm"><p className="font-semibold">{date(booking.start)} – {formatAdmissionDate(booking.end, locale, true)}</p><p>{booking.status === 'cancelled' ? l.cancelled : l.active} · {(booking.mode || slot?.mode) === 'online' ? l.online : (booking.mode || slot?.mode) === 'office' ? l.office : '—'}</p><p>{booking.consultantName || slot?.consultantName}</p><p className="break-words">{booking.location || slot?.location}</p></div>}
      {question && <div className="mt-3 space-y-3"><p className="whitespace-pre-wrap break-words"><strong>{l.student}: </strong>{question.text}</p><p className="text-xs text-[var(--color-text-muted)]">{date(question.createdAt)}</p>{question.answers?.length ? question.answers.map(answer => <div key={answer._id} className="rounded-lg bg-[var(--color-bg)] p-3"><p className="whitespace-pre-wrap break-words"><strong>{answer.provider ? l.ai : l.bot}: </strong>{answer.text}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{date(answer.createdAt)}</p></div>) : <p className="text-sm text-[var(--color-text-muted)]">{l.noAnswer}</p>}</div>}
      {section === 'profiles' && <p className="mt-3 text-sm">{lead?.summary || `${l.language}: ${lead?.language?.toUpperCase() || '—'}`}</p>}</Card>
    })}<Pagination page={page} total={total} limit={limit} onPageChange={setPage} /></div>}
    </>}
    {selected && <LeadDetail key={selected} id={selected} locale={locale} close={() => setSelected(null)} />}
  </div>
}

function LeadDetail({ id, locale, close }: { id: string; locale: keyof typeof labels; close: () => void }) {
  const l = labels[locale]
  const [lead, setLead] = useState<AdmissionLead | null>(null); const [messages, setMessages] = useState<AdmissionMessage[]>([])
  const [cursor, setCursor] = useState<string | null>(null); const [busy, setBusy] = useState(true); const [error, setError] = useState(false); const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController(); setBusy(true); setError(false)
    Promise.all([admissions.lead(id, controller.signal), admissions.messages(id, undefined, controller.signal)]).then(([detail, chat]) => { if (!controller.signal.aborted) { setLead(detail.lead); setMessages(chat.items); setCursor(chat.nextCursor) } }).catch(() => { if (!controller.signal.aborted) setError(true) }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [id, retry])
  const loadOlder = async () => { if (!cursor || busy) return; setBusy(true); setError(false); try { const chat = await admissions.messages(id, cursor); setMessages(old => [...chat.items, ...old]); setCursor(chat.nextCursor) } catch { setError(true) } finally { setBusy(false) } }
  const facts = Object.entries({ ...lead?.profile, ...lead?.studyFacts }).filter(([, value]) => displayValue(value))
  return <Modal open onClose={close} title={lead?.name || l.open} panelClassName="max-w-4xl" footer={<Button variant="secondary" onClick={close}>{l.close}</Button>}>
    {error && <p role="alert" className="my-3">{l.error} <Button size="sm" variant="ghost" onClick={() => setRetry(v => v + 1)}>{l.retry}</Button></p>}
    {!lead && busy ? <p className="py-6" role="status">{l.loading}</p> : lead && <><Card className="my-4"><dl className="grid gap-3 text-sm sm:grid-cols-2">{[[l.channel, leadChannel(lead) === 'website' ? l.website : leadChannel(lead) === 'telegram' ? 'Telegram' : '—'], [l.phone, lead.phone], [l.username, lead.username ? '@' + lead.username : '—'], [l.language, lead.language?.toUpperCase()], [l.status, statusLabels[lead.status]?.[locale === 'ru' ? 0 : locale === 'en' ? 1 : 2] || lead.status]].map(([label, value]) => <div key={label}><dt className="text-[var(--color-text-muted)]">{label}</dt><dd className="font-medium break-words">{value || '—'}</dd></div>)}</dl>{lead.summary && <p className="mt-3 whitespace-pre-wrap">{l.summary}: {lead.summary}</p>}{facts.length > 0 && <div className="mt-4"><h3 className="font-semibold">{l.preferences}</h3><dl className="mt-2 grid gap-2 sm:grid-cols-2">{facts.map(([key, value]) => <div key={key}><dt className="text-sm text-[var(--color-text-muted)]">{localizedField(key, locale)}</dt><dd className="break-words">{displayValue(value)}</dd></div>)}</dl></div>}{lead.notes && <p className="mt-3 whitespace-pre-wrap">{l.notes}: {lead.notes}</p>}</Card>
    <h3 className="mb-3 font-semibold">{l.chat}</h3>{cursor && <Button variant="secondary" size="sm" disabled={busy} onClick={loadOlder}>{busy ? l.loading : l.older}</Button>}<div className="mt-3 space-y-3">{messages.length ? messages.map(message => <article key={message._id} className={cn('max-w-[95%] rounded-xl border border-[var(--color-border)] p-3 sm:max-w-[85%]', message.direction === 'in' ? 'mr-auto bg-[var(--color-card)]' : 'ml-auto bg-[var(--color-border)]/30')}><div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-[var(--color-text-muted)]"><strong>{message.direction === 'in' ? l.student : message.direction === 'staff' ? l.staff : message.provider ? l.ai : l.bot}</strong><time>{formatAdmissionDate(message.createdAt, locale)}</time></div><p className="whitespace-pre-wrap break-words">{message.isCallback ? l.action : message.text}</p>{message.edits && message.edits.length > 0 && <details className="mt-2 text-sm"><summary className="cursor-pointer">{l.changes}</summary>{message.edits.map((edit, index) => <p key={index} className="mt-2 whitespace-pre-wrap border-t border-[var(--color-border)] pt-2">{edit.text}</p>)}</details>}{message.direction !== 'in' && message.delivered === false && <p className="mt-1 text-xs">{l.pending}</p>}</article>) : <p>{l.noChat}</p>}</div></>}
  </Modal>
}
