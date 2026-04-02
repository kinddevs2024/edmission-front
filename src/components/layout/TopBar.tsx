import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { logout as logoutApi } from '@/services/auth'
import { useSocket } from '@/hooks/useSocket'
import { useNotificationStore } from '@/store/notificationStore'
import { buildNotificationLink } from '@/services/notifications'
import { Button } from '@/components/ui/Button'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import { NotificationsDropdown } from './NotificationsDropdown'
import { LanguageMenu } from './LanguageMenu'
import { GlobalSearch } from './GlobalSearch'
import { MobileSearch } from './MobileSearch'
import { MobileNavDrawer } from './MobileNavDrawer'
import { BrandLogo } from './BrandLogo'
import { cn } from '@/utils/cn'
import { toastApiError } from '@/utils/toastError'
import { getImageUrl } from '@/services/upload'
import { getDashboardPath } from '@/utils/dashboardPath'
import { notifyInfo } from '@/utils/notify'

export function TopBar() {
  const { t } = useTranslation('common')
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const role = (user as { role?: string })?.role ?? null
  const dashboardPath = getDashboardPath(user)
  const { onNotification } = useSocket()
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    setAvatarLoadError(false)
  }, [user?.avatar])

  useEffect(() => {
    const unsubscribe = onNotification((payload) => {
      const computedLink = buildNotificationLink(
        payload.type ?? 'info',
        payload.referenceId,
        payload.metadata,
        role as import('@/types/user').Role
      )
      const link = computedLink ?? payload.link
      addNotification({
        id: payload.id,
        type: payload.type as import('@/store/notificationStore').NotificationType,
        title: payload.title,
        body: payload.body,
        link,
        referenceId: payload.referenceId,
        metadata: payload.metadata,
        createdAt: payload.createdAt ?? new Date().toISOString(),
      })

      if (!document.hidden) {
        const title = (payload.title || payload.body || t('notifications')).trim()
        const description =
          payload.title && payload.body && payload.body.trim() !== payload.title.trim()
            ? payload.body
            : undefined
        if (title) {
          notifyInfo(title, {
            description,
            duration: 6500,
            action: link
              ? {
                  label: t('toastOpenNotification', 'Open'),
                  onClick: () => {
                    window.location.assign(link)
                  },
                }
              : undefined,
          })
        }
      }

      // Browser notification when tab is in background
      if (typeof window !== 'undefined' && 'Notification' in window && document.hidden) {
        if (Notification.permission === 'granted') {
          const n = new Notification(payload.title ?? 'Edmission', {
            body: payload.body ?? '',
            icon: '/favicon.svg',
          })
          n.onclick = () => {
            window.focus()
            if (link) window.location.href = link
            n.close()
          }
        }
      }
    })
    return unsubscribe
  }, [onNotification, addNotification, role])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 min-h-16 border-b bg-[var(--color-card)] border-[var(--color-border)] px-3 sm:px-4',
        pathname === '/search' && 'max-md:hidden'
      )}
    >
      {/* Tablet / desktop */}
      <div className="hidden md:flex h-16 items-center justify-between gap-2 w-full">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            to={dashboardPath}
            className="rounded-md px-1 py-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
            aria-label={t('appName')}
          >
            <BrandLogo imageClassName="h-9 w-auto" />
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--color-border)] shrink-0">
            <GlobalSearch />
          </div>
          <NotificationsDropdown />
          <div
            className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--color-border)] min-[0px]:gap-1.5"
            aria-label={t('language')}
          >
            <LanguageMenu />
            <ThemeSwitch />
          </div>
          <Link
            to="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-primary-accent/50 transition-colors"
            aria-label={user?.name || user?.email || t('profile')}
          >
            {user?.avatar && !avatarLoadError ? (
              <img
                src={getImageUrl(user.avatar)}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => logoutApi().catch(toastApiError)}
          >
            {t('logout')}
          </Button>
          <MobileNavDrawer />
        </div>
      </div>

      {/* Mobile: иконка поиска ведёт на /search (полноэкранная страница) */}
      <div className="flex md:hidden min-h-16 w-full items-center gap-2 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              to={dashboardPath}
              className="flex min-w-0 flex-1 items-center rounded-lg py-0.5 pr-1 transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent sm:hidden"
              aria-label={t('appName')}
            >
              <BrandLogo imageClassName="h-8 w-auto max-w-[156px]" />
            </Link>
            <Link
              to={dashboardPath}
              className="hidden sm:flex min-w-0 flex-1 rounded-md px-1 py-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
              aria-label={t('appName')}
            >
              <BrandLogo imageClassName="h-9 w-auto" />
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <MobileSearch />
            <NotificationsDropdown />
            <Link
              to="/profile"
              className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-primary-accent/50 transition-colors"
              aria-label={user?.name || user?.email || t('profile')}
            >
              {user?.avatar && !avatarLoadError ? (
                <img
                  src={getImageUrl(user.avatar)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
            <MobileNavDrawer />
          </div>
        </div>
    </header>
  )
}
