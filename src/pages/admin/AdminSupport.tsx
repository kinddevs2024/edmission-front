import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  getAdminTickets,
  getAdminTicket,
  updateTicketStatus,
  addAdminTicketReply,
} from '@/services/adminTickets'
import type { AdminTicket } from '@/services/adminTickets'
import { getApiError } from '@/services/api'
import { formatDate } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'

const STATUS_OPTION_KEYS: { value: string; labelKey: string }[] = [
  { value: '', labelKey: 'all' },
  { value: 'open', labelKey: 'supportStatusOpen' },
  { value: 'in_progress', labelKey: 'supportStatusInProgress' },
  { value: 'resolved', labelKey: 'supportStatusResolved' },
  { value: 'closed', labelKey: 'supportStatusClosed' },
]

const STATUS_LABEL_KEYS: Record<string, string> = {
  open: 'supportStatusOpen',
  in_progress: 'supportStatusInProgress',
  resolved: 'supportStatusResolved',
  closed: 'supportStatusClosed',
}

export function AdminSupport() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const statusLabel = (status: string) => t(STATUS_LABEL_KEYS[status] ?? status)
  const statusOptions = STATUS_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const roleOptions = [
    { value: '', label: t('all') },
    { value: 'student', label: t('student') },
    { value: 'university', label: t('university') },
    { value: 'university_multi_manager', label: t('universityMultiManager', 'University manager') },
    { value: 'multi_university_admin', label: t('multiUniversityAdmin', 'Multi-university admin') },
    { value: 'school_counsellor', label: t('schoolCounsellor', 'School counsellor') },
  ]
  const { id } = useParams<{ id: string }>()
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [ticket, setTicket] = useState<AdminTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')
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
      .catch((e) => { toastApiError(e); setTickets([]) })
      .finally(() => setLoading(false))
  }, [statusFilter, roleFilter])

  useEffect(() => {
    if (id) {
      setLoading(true)
      setDetailError('')
      getAdminTicket(id)
        .then((t) => {
          setTicket(t)
          setStatusUpdate(t.status)
        })
        .catch((e) => {
          const apiError = getApiError(e)
          setDetailError(apiError.message)
          toastApiError(e)
          setTicket(null)
        })
        .finally(() => setLoading(false))
    } else {
      setTicket(null)
      setDetailError('')
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
          ← {t('backToTickets')}
        </Button>
        <PageTitle title={ticket.subject} icon="HelpCircle" />
        <Card>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span>{t('from')}: {ticket.userEmail ?? ticket.userId}</span>
            <span>{t('role')}: {ticket.role}</span>
            <span>{t('created')}: {formatDate(ticket.createdAt)}</span>
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
              {statusOptions.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleStatusChange} disabled={submitting}>
              {t('updateStatus')}
            </Button>
          </div>
        </Card>
        {replies.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">{t('supportReplies')}</h3>
            {replies.map((r, i) => (
              <Card key={i}>
                <div className="flex items-center gap-2 text-sm">
                  <span className={(r as { isStaff?: boolean }).isStaff ? 'text-primary-accent font-medium' : ''}>
                    {(r as { isStaff?: boolean }).isStaff ? t('supportStaff') : (r as { role?: string }).role}
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
          <CardTitle>{t('replyAsSupport')}</CardTitle>
          <form onSubmit={handleReply} className="mt-2">
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
      </div>
    )
  }

  if (id) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/support')}>
          ← {t('backToTickets')}
        </Button>
        <PageTitle title={t('supportTickets')} icon="HelpCircle" />
        <Card>
          {loading ? (
            <p className="text-[var(--color-text-muted)] text-sm">{t('loading')}</p>
          ) : (
            <>
              <CardTitle>{t('ticketUnavailable', 'Ticket unavailable')}</CardTitle>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {detailError || t('tryAgainLater', 'Please try again later.')}
              </p>
            </>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('supportTickets')} icon="HelpCircle" />
      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle>{t('supportTickets')}</CardTitle>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-[180px_180px]">
            <Select
              label={t('status')}
              options={statusOptions}
              value={statusFilter}
              className="min-h-10 py-2"
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              label={t('role')}
              options={roleOptions}
              value={roleFilter}
              className="min-h-10 py-2"
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <p className="text-[var(--color-text-muted)] text-sm">{t('loading')}</p>
        ) : tickets.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">{t('noTickets')}</p>
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
                    {t.userEmail ?? t.userId} · {statusLabel(t.status)} · {formatDate(t.createdAt)}
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
