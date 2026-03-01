import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { getNavIcon } from '@/components/icons/NavIcons'
import { LanguageMenu } from './LanguageMenu'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import { cn } from '@/utils/cn'

export function MobileNavDrawer() {
  const navItems = useMobileMenuStore((s) => s.navItems)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const hasNav = navItems && navItems.length > 0

  if (!hasNav) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-input hover:bg-[var(--color-border)]/30 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-[var(--color-text)]" aria-hidden />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden animate-page-enter"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <aside
            className={cn(
              'fixed top-0 left-0 z-50 h-full w-[min(100vw,280px)] max-w-[280px]',
              'bg-[var(--color-card)] border-r border-[var(--color-border)]',
              'flex flex-col shadow-xl lg:hidden',
              'animate-drawer-enter'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <img src="/favicon.svg" alt="" className="h-8 w-8 rounded-lg" />
              <span className="font-semibold text-[var(--color-text)]">Edmission</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-input hover:bg-[var(--color-border)]/30 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              {navItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-input text-sm transition-colors',
                      isActive
                        ? 'bg-primary-accent/15 text-primary-accent font-medium'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-border)]/20'
                    )
                  }
                >
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {getNavIcon(icon, 'size-5')}
                  </span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">Language</span>
                <LanguageMenu />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">Theme</span>
                <ThemeSwitch />
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
