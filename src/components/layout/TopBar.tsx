import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button'
import { NotificationsDropdown } from './NotificationsDropdown'
import i18n from '@/i18n'
import { supportedLngs, type SupportedLng } from '@/i18n/config'

export function TopBar() {
  const { t } = useTranslation('common')
  const { user, logout } = useAuth()
  const theme = useUIStore((s) => s.theme)

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-[var(--color-card)] border-[var(--color-border)] flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <span className="text-[var(--color-text-muted)] text-sm hidden sm:block">{t('appName')}</span>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="text-sm bg-transparent border rounded-input px-2 py-1 cursor-pointer"
          value={theme}
          onChange={(e) => useUIStore.getState().setTheme(e.target.value as 'light' | 'dark')}
        >
          <option value="light">{t('light')}</option>
          <option value="dark">{t('dark')}</option>
        </select>
        <select
          className="text-sm bg-transparent border rounded-input px-2 py-1 cursor-pointer"
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage((e.target.value as SupportedLng) || 'en')}
        >
          {supportedLngs.map((lng) => (
            <option key={lng} value={lng}>{lng.toUpperCase()}</option>
          ))}
        </select>
        <NotificationsDropdown />
        <Link to="/profile" className="text-sm text-[var(--color-text)] hover:underline">
          {user?.name || user?.email}
        </Link>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          {t('logout')}
        </Button>
      </div>
    </header>
  )
}
