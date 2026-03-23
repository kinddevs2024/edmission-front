import { useEffect, useState, useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { Languages, Menu, X } from 'lucide-react'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import { loadLanguage } from '@/i18n'
import { STORAGE_KEY, supportedLngs, type SupportedLng } from '@/i18n/config'

const LANGUAGE_LABELS: Record<SupportedLng, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
}

export function LandingHeader() {
  const { t, i18n } = useTranslation('landing')
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [mobileLangOpen, setMobileLangOpen] = useState(false)
  const mobileLangRef = useRef<HTMLDivElement>(null)
  const HEADER_OFFSET = 88

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const lockScroll = useCallback((lock: boolean) => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (lock) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.paddingRight = ''
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (menuOpen) lockScroll(true)
    else lockScroll(false)
    return () => lockScroll(false)
  }, [menuOpen, lockScroll])

  useEffect(() => {
    const onDocClick = (e: globalThis.MouseEvent) => {
      if (!mobileLangRef.current) return
      if (!mobileLangRef.current.contains(e.target as Node)) {
        setMobileLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const closeMenu = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      setMenuOpen(false)
      setIsClosing(false)
    }, 280)
  }, [isClosing])

  const handleLogoClick = useCallback((event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/') return
    event.preventDefault()
    if (menuOpen) closeMenu()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [closeMenu, location.pathname, menuOpen])

  const scrollTo = (id: string) => {
    const target = document.getElementById(id)
    if (!target) {
      closeMenu()
      return
    }

    const performScroll = () => {
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }

    if (menuOpen) {
      closeMenu()
      window.setTimeout(performScroll, 320)
      return
    }

    performScroll()
  }

  const selectLanguage = useCallback((lng: SupportedLng) => {
    setMobileLangOpen(false)
    void (async () => {
      await loadLanguage(lng)
      await i18n.changeLanguage(lng)
      try {
        localStorage.setItem(STORAGE_KEY, lng)
      } catch {
        /* ignore */
      }
    })()
  }, [i18n])

  const menuItems = [
    { id: 'how-it-works', label: t('header.howItWorks') },
    { id: 'for-universities', label: t('header.forUniversities') },
    { id: 'trusted-by', label: t('header.trustedBy') },
    { id: 'faq', label: t('header.faq') },
  ]

  const NavLink = ({ item }: { item: (typeof menuItems)[number] }) => (
    <button
      type="button"
      onClick={() => scrollTo(item.id)}
      className="text-xs font-medium text-[var(--color-text)] hover:text-primary-accent transition-colors whitespace-nowrap"
    >
      {item.label}
    </button>
  )

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-card)]/72 backdrop-blur-md transition-all duration-200',
        scrolled
          ? 'shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]'
          : 'shadow-none'
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)] shrink-0"
        >
          <img src="/logo/Group%201.png" alt="" className="h-8 w-8 rounded-lg object-cover" aria-hidden />
          {t('footer.brand')}
        </Link>

        {/* Desktop: nav links - compact, left to right */}
        <nav className="hidden lg:flex items-center gap-4">
          {menuItems.map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>

        <nav className="flex items-center gap-2 sm:gap-3">
          {/* Desktop: Language, Theme, Login, Register */}
          <div className="hidden lg:flex items-center gap-2">
            <LanguageMenu />
            <ThemeSwitch />
            <Link
              to="/login"
              className="rounded-input border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
            >
              {t('header.login')}
            </Link>
            <Link
              to="/register"
              className="rounded-input bg-primary-accent px-3 py-2 text-sm font-medium text-primary-dark hover:opacity-90 transition-colors"
            >
              {t('header.register')}
            </Link>
          </div>

          {/* Mobile: Register + Menu or Close */}
          <div className="lg:hidden flex items-center gap-2 flex-1 max-w-[300px] justify-end">
            <Link
              to="/register"
              className="flex-1 min-w-0 flex items-center justify-center rounded-full h-11 px-4 bg-primary-accent text-primary-dark text-sm font-medium hover:opacity-90 transition-colors"
            >
              <span className="truncate">{t('header.register')}</span>
            </Link>
            <div className="relative" ref={mobileLangRef}>
              <button
                type="button"
                onClick={() => setMobileLangOpen((v) => !v)}
                className="flex items-center justify-center rounded-full h-11 w-11 border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
                aria-label="Change language"
                aria-expanded={mobileLangOpen}
                aria-haspopup="true"
              >
                <Languages className="h-5 w-5 shrink-0" aria-hidden />
              </button>
              {mobileLangOpen && (
                <div
                  className="absolute right-0 top-full mt-2 min-w-[148px] rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg py-1 z-50"
                  role="menu"
                >
                  {supportedLngs.map((lng) => {
                    const current = (i18n.language || 'en').split('-')[0].toLowerCase() as SupportedLng
                    const isCurrent = current === lng
                    return (
                      <button
                        key={lng}
                        type="button"
                        role="menuitem"
                        onClick={() => selectLanguage(lng)}
                        className={clsx(
                          'w-full px-3 py-2 text-left text-sm transition-colors',
                          isCurrent
                            ? 'bg-primary-accent/15 text-primary-accent font-medium'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-border)]/20'
                        )}
                      >
                        {LANGUAGE_LABELS[lng]}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {menuOpen ? (
              <button
                type="button"
                onClick={closeMenu}
                className="flex items-center justify-center rounded-full h-11 w-11 border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 shrink-0" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex items-center justify-center gap-2 rounded-full h-11 w-11 border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 shrink-0" aria-hidden />
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile drawer - portal to body to avoid header's backdrop-filter breaking fixed positioning */}
      {menuOpen &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 z-[9999] bg-black/50 lg:hidden transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
              aria-hidden
              onClick={closeMenu}
            />
            <aside
              className="fixed top-0 right-0 z-[10000] h-full w-full max-w-[280px] bg-[var(--color-card)] border-l border-[var(--color-border)] shadow-xl lg:hidden flex flex-col"
              style={{ animation: isClosing ? 'drawer-out-right 0.28s ease-in forwards' : 'drawer-in-right 0.3s ease-out both' }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--color-border)]">
                <span className="font-semibold text-[var(--color-text)]">{t('header.menu', 'Menu')}</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex items-center justify-center rounded-full h-10 w-10 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 shrink-0" aria-hidden />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                <div className="flex gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex-1 flex items-center justify-center rounded-input border border-[var(--color-border)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
                  >
                    {t('header.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="flex-1 flex items-center justify-center rounded-input bg-primary-accent px-3 py-2.5 text-sm font-medium text-primary-dark hover:opacity-90 transition-colors"
                  >
                    {t('header.register')}
                  </Link>
                </div>
              </nav>
              <div className="p-4 border-t border-[var(--color-border)] flex items-center gap-3">
                <LanguageMenu placement="top" />
                <ThemeSwitch />
              </div>
            </aside>
          </>,
          document.body
        )}
    </header>
  )
}
