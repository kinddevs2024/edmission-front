import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useNotificationStore } from '@/store/notificationStore'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notifications'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toastApiError } from '@/utils/toastError'

const MAX_VISIBLE = 10

const MD_BREAKPOINT = '(max-width: 767px)'

export function NotificationsDropdown() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { role } = useAuth()
  const { items, unreadCount, setNotifications, markAsRead, markAllAsRead } = useNotificationStore()

  useEffect(() => {
    const mq = window.matchMedia(MD_BREAKPOINT)
    const sync = () => setIsMobileLayout(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (isMobileLayout) setOpen(false)
  }, [isMobileLayout])

  useEffect(() => {
    getNotifications({ limit: 30 }, role)
      .then((res) => setNotifications(res.data))
      .catch(toastApiError)
  }, [setNotifications, role])

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    const timeout = window.setTimeout(() => setMounted(false), 200)
    return () => window.clearTimeout(timeout)
  }, [open])

  const closeDropdown = () => setOpen(false)

  const bellClassName =
    'relative p-2 rounded-input hover:bg-[var(--color-border)]/30 transition-colors inline-flex items-center justify-center'

  const bellContent = (
    <>
      <svg className="w-5 h-5 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m-6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-accent text-primary-dark text-xs font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </>
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkRead = (id: string) => {
    markAsRead(id)
    markNotificationRead(id).catch(toastApiError)
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
    markAllNotificationsRead().catch(toastApiError)
  }

  return (
    <div className="relative" ref={ref}>
      {isMobileLayout ? (
        <Link
          to="/notifications"
          className={bellClassName}
          aria-label={t('notifications')}
        >
          {bellContent}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={bellClassName}
          aria-label={t('notifications')}
          aria-expanded={open}
        >
          {bellContent}
        </button>
      )}

      {!isMobileLayout && mounted && (
        <div
          className={cn(
            'z-50 flex flex-col overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)]',
            'fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.25rem)] w-[min(calc(100vw-1rem),22rem)] max-h-[min(28rem,calc(100vh-5.5rem))] shadow-2xl',
            '-translate-x-1/2 origin-top transition-[transform,opacity] will-change-transform md:absolute md:right-0 md:left-auto md:top-full md:mt-1 md:w-80 md:max-h-[min(24rem,70vh)] md:translate-x-0 md:origin-top-right md:shadow-lg',
            open
              ? 'scale-100 opacity-100 translate-y-0 duration-[480ms] ease-out'
              : 'pointer-events-none scale-[0.94] opacity-0 -translate-y-1.5 duration-100 ease-in md:translate-y-0'
          )}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
            <span className="font-medium text-sm">{t('notifications')}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary-accent hover:underline"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>
          <ul className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
                {t('noNotifications')}
              </li>
            ) : (
              items.slice(0, MAX_VISIBLE).map((n) => (
                <li key={n.id}>
                  {n.link ? (
                    <Link
                      to={n.link}
                      className={cn(
                        'block w-full text-left px-4 py-3 hover:bg-[var(--color-border)]/20 transition-colors border-b border-[var(--color-border)]',
                        !n.read && 'bg-primary-accent/5'
                      )}
                      onClick={() => {
                        handleMarkRead(n.id)
                        closeDropdown()
                      }}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.body}</p>}
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDate(n.createdAt)}</p>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-[var(--color-border)]/20 transition-colors border-b border-[var(--color-border)]',
                        !n.read && 'bg-primary-accent/5'
                      )}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.body}</p>}
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDate(n.createdAt)}</p>
                    </button>
                  )}
                </li>
              ))
            )}
            <li className="border-t border-[var(--color-border)]">
              <Link
                to="/notifications"
                className="block px-4 py-2.5 text-center text-sm text-primary-accent hover:bg-[var(--color-border)]/20"
                onClick={() => closeDropdown()}
              >
                {t('viewAllNotifications', 'View all notifications')}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
