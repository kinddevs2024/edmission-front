import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { Menu, X } from 'lucide-react'
import { LanguageMenu } from '@/components/layout/LanguageMenu'

export function LandingHeader() {
  const { t } = useTranslation('landing')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const menuItems = [
    { id: 'how-it-works', label: t('header.howItWorks') },
    { id: 'for-universities', label: t('header.forUniversities') },
    { id: 'faq', label: t('header.faq') },
  ]

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 w-full border-b transition-all duration-200',
        scrolled
          ? 'border-[var(--color-border)] bg-[var(--color-card)]/95 shadow-[var(--shadow-card)] backdrop-blur-sm'
          : 'border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
          <img src="/logo/Group%201.png" alt="" className="h-8 w-8 rounded-lg object-cover" aria-hidden />
          Edmission
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          {/* Desktop: dropdown with nav + Login */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-input border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-card)] transition-colors"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <Menu className="h-4 w-4" aria-hidden />
              {t('header.menu', 'Menu')}
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 min-w-[200px] rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg py-1 z-50 animate-modal-enter"
                role="menu"
              >
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => { scrollTo(item.id); setDropdownOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-[var(--color-border)] my-1" />
                <Link
                  to="/login"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
                >
                  {t('header.login')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: two equal-size buttons — Menu and Register, no language */}
          <div className="sm:hidden flex items-center gap-2 flex-1 max-w-[240px] justify-end">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-full h-11 px-4 border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-border)]/20 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t('header.menu', 'Menu')}</span>
            </button>
            <Link
              to="/register"
              className="flex-1 min-w-0 flex items-center justify-center rounded-full h-11 px-4 bg-primary-accent text-primary-dark text-sm font-medium hover:opacity-90 transition-colors"
            >
              <span className="truncate">{t('header.register')}</span>
            </Link>
          </div>

          {/* Desktop: Register + Language */}
          <Link
            to="/register"
            className="hidden sm:flex rounded-input bg-primary-accent px-3 py-2 text-sm font-medium text-primary-dark hover:opacity-90 min-h-[44px] min-w-[44px] items-center justify-center"
          >
            {t('header.register')}
          </Link>
          <div className="hidden sm:block">
            <LanguageMenu />
          </div>
        </nav>
      </div>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 sm:hidden"
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="fixed top-0 left-0 z-50 h-full w-full max-w-[280px] bg-[var(--color-card)] border-r border-[var(--color-border)] shadow-xl sm:hidden flex flex-col animate-drawer-enter"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <span className="font-semibold text-[var(--color-text)]">{t('header.menu', 'Menu')}</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-input hover:bg-[var(--color-border)]/30 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className="block w-full px-3 py-3 text-left text-base text-[var(--color-text)] hover:bg-[var(--color-border)]/20 rounded-input transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-3 text-base font-medium text-[var(--color-text)] hover:bg-[var(--color-border)]/20 rounded-input transition-colors"
              >
                {t('header.login')}
              </Link>
            </nav>
          </aside>
        </>
      )}
    </header>
  )
}
