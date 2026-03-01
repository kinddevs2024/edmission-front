import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationStore } from '@/store/notificationStore'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notifications'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const MAX_VISIBLE = 10

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { role } = useAuth()
  const { items, unreadCount, setNotifications, markAsRead, markAllAsRead } = useNotificationStore()

  useEffect(() => {
    getNotifications({ limit: 30 }, role)
      .then((res) => setNotifications(res.data))
      .catch(() => {})
  }, [setNotifications, role])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkRead = (id: string) => {
    markAsRead(id)
    markNotificationRead(id).catch(() => {})
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
    markAllNotificationsRead().catch(() => {})
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-input hover:bg-[var(--color-border)]/30 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg className="w-5 h-5 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m-6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-accent text-primary-dark text-xs font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-[min(24rem,70vh)] overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
            <span className="font-medium text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
                No notifications
              </li>
            ) : (
              <>
              {items.slice(0, MAX_VISIBLE).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      handleMarkRead(n.id)
                      if (n.link) setOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-[var(--color-border)]/20 transition-colors border-b border-[var(--color-border)] last:border-0',
                      !n.read && 'bg-primary-accent/5'
                    )}
                  >
                    {n.link ? (
                      <Link to={n.link} className="block" onClick={() => setOpen(false)}>
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.body}</p>}
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDate(n.createdAt)}</p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.body}</p>}
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDate(n.createdAt)}</p>
                      </>
                    )}
                  </button>
                </li>
              ))}
              <li className="border-t border-[var(--color-border)]">
                <Link
                  to="/notifications"
                  className="block px-4 py-2.5 text-center text-sm text-primary-accent hover:bg-[var(--color-border)]/20"
                  onClick={() => setOpen(false)}
                >
                  View all notifications
                </Link>
              </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
