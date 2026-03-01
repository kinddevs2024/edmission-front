import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { useNotificationStore } from '@/store/notificationStore'
import { Button } from '@/components/ui/Button'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import { NotificationsDropdown } from './NotificationsDropdown'
import { LanguageMenu } from './LanguageMenu'
import { MobileNavDrawer } from './MobileNavDrawer'
import { cn } from '@/utils/cn'

export function TopBar() {
  const { t } = useTranslation('common')
  const { user, logout } = useAuth()
  const { onNotification } = useSocket()
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    const unsubscribe = onNotification((payload) => {
      addNotification({
        id: payload.id,
        type: payload.type as import('@/store/notificationStore').NotificationType,
        title: payload.title,
        body: payload.body,
        link: payload.link,
        createdAt: payload.createdAt ?? new Date().toISOString(),
      })
    })
    return unsubscribe
  }, [onNotification, addNotification])

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-[var(--color-card)] border-[var(--color-border)] flex items-center justify-between px-3 sm:px-4 gap-2">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <MobileNavDrawer />
        <span className="text-[var(--color-text-muted)] text-sm hidden sm:block truncate">{t('appName')}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={cn(
            'flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--color-border)]',
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
          className="text-sm text-[var(--color-text)] hover:text-primary-accent transition-colors truncate max-w-[120px] sm:max-w-[180px]"
        >
          {user?.name || user?.email}
        </Link>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          {t('logout')}
        </Button>
      </div>
    </header>
  )
}
