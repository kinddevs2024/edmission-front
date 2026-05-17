import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { useAuth } from '@/hooks/useAuth'
import { getActAsUniversityUserId } from '@/constants/actAsUniversity'
import { createTicket, getMyTickets, getTicket, addTicketReply } from '@/services/tickets'
import type { Ticket } from '@/services/tickets'
import { getApiError } from '@/services/api'
import { formatDate } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

const STATUS_KEYS: Record<string, string> = {
  open: 'supportStatusOpen',
  in_progress: 'supportStatusInProgress',
  resolved: 'supportStatusResolved',
  closed: 'supportStatusClosed',
}

export function SupportPage() {
  const { t } = useTranslation(['common', 'university'])
  const statusLabel = (status: string) => t(STATUS_KEYS[status] ?? status)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [replyText, setReplyText] = useState('')
  const isMultiUniversityRole = user?.role === 'university_multi_manager' || user?.role === 'multi_university_admin'
  const needsUniversitySelection = isMultiUniversityRole && !getActAsUniversityUserId()

  useEffect(() => {
    if (needsUniversitySelection) {
      setLoading(false)
      return
    }
    getMyTickets({ limit: 50 })
      .then((res) => setTickets(res.data ?? []))
      .catch((e) => { toastApiError(e); setTickets([]) })
      .finally(() => setLoading(false))
  }, [needsUniversitySelection])

  useEffect(() => {
    if (needsUniversitySelection) return
    if (id) {
      setLoading(true)
      getTicket(id)
        .then(setTicket)
        .catch((e) => { toastApiError(e); setTicket(null) })
        .finally(() => setLoading(false))
    } else {
      setTicket(null)
    }
  }, [id, needsUniversitySelection])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!subject.trim() || !message.trim()) {
      setError(t('fillSubjectAndMessage'))
      return
    }
    setSubmitting(true)
    createTicket(subject.trim(), message.trim())
      .then((t) => {
        setSubject('')
        setMessage('')
        navigate(`/support/${t.id}`)
        setTickets((prev) => [t, ...prev])
      })
      .catch((err) => setError(getApiError(err).message))
      .finally(() => setSubmitting(false))
  }

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !replyText.trim()) return
    setSubmitting(true)
    addTicketReply(id, replyText.trim())
      .then((updated) => {
        setReplyText('')
        if (updated) setTicket(updated)
      })
      .catch((err) => setError(getApiError(err).message))
      .finally(() => setSubmitting(false))
  }

  if (needsUniversitySelection) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <PageTitle title={t('common:support', 'Support')} icon="HelpCircle" />
        <Card>
          <CardTitle>{t('university:selectUniversity', 'Select university')}</CardTitle>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {t('university:selectUniversityBeforeSupport', 'Choose a university before opening support tickets for a university account.')}
          </p>
          <Button to="/university-multi-manager" className="mt-4">
            {t('university:multiManagerOpenHub', 'Open universities')}
          </Button>
        </Card>
      </div>
    )
  }

  if (id && ticket) {
    const replies = ticket.replies ?? []
    return (
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/support')}>
          ← {t('backToMyTickets')}
        </Button>
        <PageTitle title={ticket.subject} icon="HelpCircle" />
        <Card>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span>{t('status')}: {statusLabel(ticket.status)}</span>
            <span>{t('created')}: {formatDate(ticket.createdAt)}</span>
          </div>
          <div className="mt-3 p-3 rounded-input bg-[var(--color-bg)] text-sm whitespace-pre-wrap">
            {ticket.message}
          </div>
        </Card>
        {replies.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">{t('supportReplies')}</h3>
            {replies.map((r, i) => (
              <Card key={i}>
                <div className="flex items-center gap-2 text-sm">
                  <span className={r.isStaff ? 'text-primary-accent font-medium' : ''}>
                    {r.isStaff ? t('supportStaff') : r.role}
                  </span>
                  <span className="text-[var(--color-text-muted)]">{formatDate((r as { createdAt: string }).createdAt)}</span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{r.message}</p>
              </Card>
            ))}
          </div>
        )}
        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <Card>
            <form onSubmit={handleReply}>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <Textarea
                placeholder={t('yourReply')}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={submitting}
                rows={4}
              />
              <Button type="submit" size="sm" className="mt-2" disabled={submitting || !replyText.trim()}>
                {t('sendReply')}
              </Button>
            </form>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <PageTitle title={t('support')} icon="HelpCircle" />

      <Card>
        <CardTitle>{t('newRequest')}</CardTitle>
        <form onSubmit={handleCreate} className="mt-3 space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            type="text"
            className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            placeholder={t('subject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={submitting}
          />
          <Textarea
            label={t('describeIssue')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            rows={5}
          />
          <Button type="submit" disabled={submitting || !subject.trim() || !message.trim()}>
            {t('sendRequest')}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>{t('myRequests')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] text-sm">{t('loading')}</p>
        ) : tickets.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">{t('noTicketsYet')}</p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="w-full text-left p-3 rounded-input border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
                  onClick={() => navigate(`/support/${t.id}`)}
                >
                  <span className="font-medium">{t.subject}</span>
                  <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                    {statusLabel(t.status)} · {formatDate(t.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
