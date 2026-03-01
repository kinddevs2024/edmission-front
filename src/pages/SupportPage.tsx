import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { createTicket, getMyTickets, getTicket, addTicketReply } from '@/services/tickets'
import type { Ticket } from '@/services/tickets'
import { getApiError } from '@/services/api'
import { formatDate } from '@/utils/format'

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export function SupportPage() {
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

  useEffect(() => {
    getMyTickets({ limit: 50 })
      .then((res) => setTickets(res.data ?? []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (id) {
      setLoading(true)
      getTicket(id)
        .then(setTicket)
        .catch(() => setTicket(null))
        .finally(() => setLoading(false))
    } else {
      setTicket(null)
    }
  }, [id])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!subject.trim() || !message.trim()) {
      setError('Please fill subject and message.')
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

  if (id && ticket) {
    const replies = ticket.replies ?? []
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/support')}>
          ← Back to my tickets
        </Button>
        <PageTitle title={ticket.subject} icon="HelpCircle" />
        <Card>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span>Status: {STATUS_LABEL[ticket.status] ?? ticket.status}</span>
            <span>Created: {formatDate(ticket.createdAt)}</span>
          </div>
          <div className="mt-3 p-3 rounded-input bg-[var(--color-bg)] text-sm whitespace-pre-wrap">
            {ticket.message}
          </div>
        </Card>
        {replies.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Replies</h3>
            {replies.map((r, i) => (
              <Card key={i}>
                <div className="flex items-center gap-2 text-sm">
                  <span className={r.isStaff ? 'text-primary-accent font-medium' : ''}>
                    {r.isStaff ? 'Support' : r.role}
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
              <textarea
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm min-h-[100px]"
                placeholder="Your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={submitting}
              />
              <Button type="submit" size="sm" className="mt-2" disabled={submitting || !replyText.trim()}>
                Send reply
              </Button>
            </form>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageTitle title="Support" icon="HelpCircle" />

      <Card>
        <CardTitle>New request</CardTitle>
        <form onSubmit={handleCreate} className="mt-3 space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            type="text"
            className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={submitting}
          />
          <textarea
            className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm min-h-[120px]"
            placeholder="Describe your issue or question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
          />
          <Button type="submit" disabled={submitting || !subject.trim() || !message.trim()}>
            Send request
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>My requests</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] text-sm">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">No tickets yet.</p>
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
                    {STATUS_LABEL[t.status] ?? t.status} · {formatDate(t.createdAt)}
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
