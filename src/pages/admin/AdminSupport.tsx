import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { Select } from '@/components/ui/Select'
import {
  getAdminTickets,
  getAdminTicket,
  updateTicketStatus,
  addAdminTicketReply,
} from '@/services/adminTickets'
import type { AdminTicket } from '@/services/adminTickets'
import { getApiError } from '@/services/api'
import { formatDate } from '@/utils/format'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export function AdminSupport() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [ticket, setTicket] = useState<AdminTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [replyText, setReplyText] = useState('')
  const [statusUpdate, setStatusUpdate] = useState('')
  const limit = 20

  useEffect(() => {
    setLoading(true)
    getAdminTickets({
      limit,
      status: statusFilter || undefined,
      role: roleFilter || undefined,
    })
      .then((res) => setTickets(res.data ?? []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [statusFilter, roleFilter])

  useEffect(() => {
    if (id) {
      setLoading(true)
      getAdminTicket(id)
        .then((t) => {
          setTicket(t)
          setStatusUpdate(t.status)
        })
        .catch(() => setTicket(null))
        .finally(() => setLoading(false))
    } else {
      setTicket(null)
    }
  }, [id])

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !replyText.trim()) return
    setSubmitting(true)
    setError('')
    addAdminTicketReply(id, replyText.trim())
      .then((updated) => {
        setReplyText('')
        if (updated) setTicket(updated as AdminTicket)
      })
      .catch((err) => setError(getApiError(err).message))
      .finally(() => setSubmitting(false))
  }

  const handleStatusChange = () => {
    if (!id || !statusUpdate) return
    setSubmitting(true)
    updateTicketStatus(id, statusUpdate)
      .then((updated) => {
        setTicket((prev) => (prev ? { ...prev, status: updated.status } : null))
      })
      .catch((err) => setError(getApiError(err).message))
      .finally(() => setSubmitting(false))
  }

  if (id && ticket) {
    const replies = ticket.replies ?? []
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/support')}>
          ← Back to tickets
        </Button>
        <PageTitle title={ticket.subject} icon="HelpCircle" />
        <Card>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span>From: {ticket.userEmail ?? ticket.userId}</span>
            <span>Role: {ticket.role}</span>
            <span>Created: {formatDate(ticket.createdAt)}</span>
          </div>
          <div className="mt-3 p-3 rounded-input bg-[var(--color-bg)] text-sm whitespace-pre-wrap">
            {ticket.message}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              className="rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm"
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
            >
              {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleStatusChange} disabled={submitting}>
              Update status
            </Button>
          </div>
        </Card>
        {replies.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Replies</h3>
            {replies.map((r, i) => (
              <Card key={i}>
                <div className="flex items-center gap-2 text-sm">
                  <span className={(r as { isStaff?: boolean }).isStaff ? 'text-primary-accent font-medium' : ''}>
                    {(r as { isStaff?: boolean }).isStaff ? 'Support' : (r as { role?: string }).role}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    {formatDate((r as { createdAt?: string }).createdAt ?? '')}
                  </span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{(r as { message?: string }).message}</p>
              </Card>
            ))}
          </div>
        )}
        <Card>
          <CardTitle>Reply as support</CardTitle>
          <form onSubmit={handleReply} className="mt-2">
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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Support tickets" icon="HelpCircle" />
      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            label="Role"
            options={[
              { value: '', label: 'All' },
              { value: 'student', label: 'Student' },
              { value: 'university', label: 'University' },
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
        {loading ? (
          <p className="text-[var(--color-text-muted)] text-sm">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">No tickets.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="w-full text-left p-3 rounded-input border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
                  onClick={() => navigate(`/admin/support/${t.id}`)}
                >
                  <span className="font-medium">{t.subject}</span>
                  <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                    {t.userEmail ?? t.userId} · {STATUS_LABEL[t.status] ?? t.status} · {formatDate(t.createdAt)}
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
