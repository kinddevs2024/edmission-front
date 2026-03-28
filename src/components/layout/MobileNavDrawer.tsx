import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { useAuth } from '@/hooks/useAuth'
import { getNavIcon } from '@/components/icons/NavIcons'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import { cn } from '@/utils/cn'
import { getDashboardPath } from '@/utils/dashboardPath'

export function MobileNavDrawer() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const navItems = useMobileMenuStore((s) => s.navItems)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const dashboardPath = getDashboardPath(user)

  useEffect(() => {
    setOpen(false)
  }, [location.key])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
  }, [open])

  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const hasNav = navItems && navItems.length > 0

  if (!hasNav) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-input hover:bg-[var(--color-border)]/30 transition-colors"
        aria-label={t('openMainMenu')}
      >
        <Menu className="w-5 h-5 text-[var(--color-text)]" aria-hidden />
      </button>

      <AnimatePresence
        onExitComplete={() => {
          document.body.style.overflow = ''
        }}
      >
        {open && (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="mobile-nav-panel"
              className={cn(
                'fixed top-0 right-0 z-[51] h-full w-full md:max-w-[280px]',
                'bg-[var(--color-card)] border-l border-[var(--color-border)]',
                'flex flex-col shadow-xl lg:hidden'
              )}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              role="dialog"
              aria-modal="true"
              aria-label={t('mainNavigationMenu')}
            >
            <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--color-border)]">
              <Link
                to={dashboardPath}
                onClick={() => setOpen(false)}
                className="flex min-w-0 flex-1 items-center justify-start gap-3 rounded-xl px-1 py-1 transition-colors hover:text-primary-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
              >
                <img src="/logo/Group%201.png" alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                <span className="truncate text-left text-lg font-semibold text-[var(--color-text)]">{t('appName')}</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 p-2 rounded-input hover:bg-[var(--color-border)]/30 transition-colors"
                aria-label={t('closeMainMenu')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav
              className="flex-1 overflow-y-auto p-2"
              style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
            >
              {navItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-input text-sm transition-colors text-left',
                      isActive
                        ? 'bg-primary-accent/15 text-primary-accent font-medium'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-border)]/20'
                    )
                  }
                >
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {getNavIcon(icon, 'size-5')}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                </NavLink>
              ))}
            </nav>
            <div
              className="p-4 border-t border-[var(--color-border)]"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">{t('theme')}</span>
                <ThemeSwitch />
              </div>
            </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
