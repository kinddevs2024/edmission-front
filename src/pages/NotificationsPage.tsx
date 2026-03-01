import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { getNavIcon } from '@/components/icons/NavIcons'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteNotificationsBulk,
  buildNotificationLink,
} from '@/services/notifications'
import { useNotificationStore } from '@/store/notificationStore'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { NotificationItem, NotificationType } from '@/store/notificationStore'

const TYPE_OPTIONS: { value: '' | NotificationType; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'message', label: 'Message' },
  { value: 'offer', label: 'Offer' },
  { value: 'offer_accepted', label: 'Offer accepted' },
  { value: 'offer_declined', label: 'Offer declined' },
  { value: 'interest', label: 'Interest' },
  { value: 'status_update', label: 'Status update' },
  { value: 'system', label: 'System' },
]

export function NotificationsPage() {
  const { role } = useAuth()
  const { removeNotification, removeNotifications, markAsRead, markAllAsRead, setNotifications } = useNotificationStore()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('')
  const [filterUnread, setFilterUnread] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  const fetchList = () => {
    setLoading(true)
    getNotifications(
      {
        page,
        limit,
        type: filterType || undefined,
        unread: filterUnread || undefined,
      },
      role
    )
      .then((res) => {
        setItems(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchList()
  }, [page, limit, filterType, filterUnread, role])

  const handleMarkRead = (n: NotificationItem) => {
    if (n.read) return
    setActionLoading(n.id)
    markNotificationRead(n.id)
      .then(() => {
        markAsRead(n.id)
        setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
      })
      .catch(() => {})
      .finally(() => setActionLoading(null))
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
      .then(() => {
        markAllAsRead()
        setItems((prev) => prev.map((i) => ({ ...i, read: true })))
      })
      .catch(() => {})
  }

  const handleDeleteOne = (id: string) => {
    setActionLoading(id)
    deleteNotification(id)
      .then(() => {
        removeNotification(id)
        setItems((prev) => prev.filter((i) => i.id !== id))
        setTotal((t) => Math.max(0, t - 1))
      })
      .catch(() => {})
      .finally(() => setActionLoading(null))
  }

  const handleDeleteRead = () => {
    deleteNotificationsBulk({ readOnly: true })
      .then(() => {
        const readIds = items.filter((i) => i.read).map((i) => i.id)
        removeNotifications(readIds)
        fetchList()
      })
      .catch(() => {})
  }

  const handleDeleteAll = () => {
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true)
      return
    }
    deleteNotificationsBulk({})
      .then(() => {
        removeNotifications(items.map((i) => i.id))
        setNotifications([])
        setItems([])
        setTotal(0)
        setConfirmDeleteAll(false)
      })
      .catch(() => {})
  }

  const linkFor = (n: NotificationItem) =>
    n.link ?? buildNotificationLink(n.type, n.referenceId, n.metadata, role)

  const readCount = items.filter((i) => i.read).length
  const hasRead = readCount > 0

  return (
    <div className="space-y-4">
      <PageTitle title="Notifications" icon="Bell" />

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setPage(1)
            }}
            className="rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            aria-label="Filter by type"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filterUnread}
              onChange={(e) => {
                setFilterUnread(e.target.checked)
                setPage(1)
              }}
              className="rounded border-[var(--color-border)]"
            />
            Unread only
          </label>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
            {hasRead && (
              <Button variant="secondary" size="sm" onClick={handleDeleteRead}>
                Delete read
              </Button>
            )}
            <Button
              variant={confirmDeleteAll ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleDeleteAll}
              onBlur={() => setTimeout(() => setConfirmDeleteAll(false), 200)}
            >
              {confirmDeleteAll ? 'Confirm delete all' : 'Delete all'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse rounded bg-[var(--color-border)]/30" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You have no notifications matching the current filters."
          />
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((n) => {
              const link = linkFor(n)
              const loadingThis = actionLoading === n.id
              return (
                <li
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 py-3 first:pt-0',
                    !n.read && 'bg-primary-accent/5 -mx-2 px-2 rounded'
                  )}
                >
                  <span className="shrink-0 mt-0.5 text-[var(--color-text-muted)]">
                    {getNavIcon(n.type === 'message' ? 'MessageCircle' : n.type === 'offer' ? 'Gift' : 'Bell', 'size-5')}
                  </span>
                  <div className="min-w-0 flex-1">
                    {link ? (
                      <Link to={link} className="block hover:underline">
                        <p className="font-medium text-sm">{n.title}</p>
                        {n.body && (
                          <p className="text-sm text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                      </Link>
                    ) : (
                      <>
                        <p className="font-medium text-sm">{n.title}</p>
                        {n.body && (
                          <p className="text-sm text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n)}
                        disabled={loadingThis}
                        className="p-1.5 rounded hover:bg-[var(--color-border)]/30 text-[var(--color-text-muted)] disabled:opacity-50"
                        aria-label="Mark as read"
                        title="Mark as read"
                      >
                        {getNavIcon('Check', 'size-4')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteOne(n.id)}
                      disabled={loadingThis}
                      className="p-1.5 rounded hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-600 disabled:opacity-50"
                      aria-label="Delete"
                      title="Delete"
                    >
                      {getNavIcon('Trash2', 'size-4')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)]">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
