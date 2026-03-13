import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
import { cn } from '@/utils/cn'
import { toastApiError } from '@/utils/toastError'
import { getStudentAvatarUrl } from '@/services/upload'

export function TopBar() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const role = (user as { role?: string })?.role ?? null
  const { onNotification } = useSocket()
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    const unsubscribe = onNotification((payload) => {
      const link = payload.link ?? buildNotificationLink(
        payload.type ?? 'info',
        payload.referenceId,
        payload.metadata,
        role as import('@/types/user').Role
      )
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
    <header className="sticky top-0 z-30 h-16 border-b bg-[var(--color-card)] border-[var(--color-border)] flex items-center justify-between px-3 sm:px-4 gap-2">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <MobileNavDrawer />
        <span className="text-[var(--color-text-muted)] text-sm hidden sm:block truncate">{t('appName')}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
        <div className="hidden md:flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--color-border)] shrink-0">
          <GlobalSearch />
        </div>
        <div className={cn('md:hidden flex-1 min-w-0 flex justify-end', mobileSearchOpen && 'flex-1')}>
          <MobileSearch
            open={mobileSearchOpen}
            onOpen={() => setMobileSearchOpen(true)}
            onClose={() => setMobileSearchOpen(false)}
          />
        </div>
        {!mobileSearchOpen && (
          <>
            <div
              className={cn(
                'hidden md:flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--color-border)]',
                'min-[0px]:gap-1.5'
              )}
              aria-label="Language and theme"
            >
              <LanguageMenu />
              <ThemeSwitch />
            </div>
            <NotificationsDropdown />
            <Link
              to="/profile"
              className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-primary-accent/50 transition-colors"
              aria-label={user?.name || user?.email || t('profile')}
            >
              {user?.avatar ? (
                <img src={getStudentAvatarUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
            <Button variant="ghost" size="sm" onClick={() => logoutApi().catch(toastApiError)}>
              {t('logout')}
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
