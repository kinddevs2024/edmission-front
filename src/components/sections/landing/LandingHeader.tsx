import { useEffect, useState, useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { Menu, X } from 'lucide-react'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { LandingSocialAuthLinks } from '@/components/auth/AuthSocialButtons'
import { loadLanguage } from '@/i18n'
import { STORAGE_KEY, supportedLngs, type SupportedLng } from '@/i18n/config'
import { Button } from '@/components/ui/Button'

const LANGUAGE_LABELS: Record<SupportedLng, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
}

const LANGUAGE_FLAG_SRC: Record<SupportedLng, string> = {
  en: 'https://flagcdn.com/w80/us.png',
  ru: 'https://flagcdn.com/w80/ru.png',
  uz: 'https://flagcdn.com/w80/uz.png',
}

export function LandingHeader() {
  const { t, i18n } = useTranslation(['landing', 'auth'])
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [mobileLangOpen, setMobileLangOpen] = useState(false)
  const mobileLangRef = useRef<HTMLDivElement>(null)
  const HEADER_OFFSET = 96
  const showGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim())
  const showYandexAuth = Boolean(import.meta.env.VITE_YANDEX_CLIENT_ID?.trim())
  const currentLng = (i18n.language || 'en').split('-')[0].toLowerCase() as SupportedLng

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

  /** MainLayout may keep content in an overflow-auto flex child. Use it only if it can actually scroll. */
  const getScrollParent = (node: HTMLElement): Element | Window => {
    let parent = node.parentElement
    while (parent && parent !== document.documentElement) {
      const { overflow, overflowY } = getComputedStyle(parent)
      const hasScrollableStyle =
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflowY === 'overlay' ||
        overflow === 'auto' ||
        overflow === 'scroll' ||
        overflow === 'overlay'
      const canScrollVertically = parent.scrollHeight > parent.clientHeight + 1
      if (hasScrollableStyle && canScrollVertically) {
        return parent
      }
      parent = parent.parentElement
    }
    return window
  }

  const scrollTo = (id: string) => {
    const target = document.getElementById(id)
    if (!target) {
      closeMenu()
      return
    }

    const performScroll = () => {
      const scroller = getScrollParent(target)
      if (scroller === window) {
        const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
        return
      }
      const el = scroller as HTMLElement
      const st = el.scrollTop
      const containerTop = el.getBoundingClientRect().top
      const targetTop = target.getBoundingClientRect().top
      el.scrollTo({
        top: Math.max(0, st + targetTop - containerTop - HEADER_OFFSET),
        behavior: 'smooth',
      })
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
    { id: 'explore', label: t('header.explore', 'Explore') },
    { id: 'how-it-works', label: t('header.howItWorks') },
    { id: 'about-us', label: t('header.aboutUs') },
    { id: 'student-testimonials', label: t('header.studentTestimonials') },
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center text-lg font-semibold text-[var(--color-text)] shrink-0 rounded-md py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
          aria-label={t('footer.brand')}
        >
          <BrandLogo imageClassName="h-8 w-auto sm:h-9" />
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
            <Button
              to="/login"
              variant="secondary"
              size="md"
            >
              {t('header.login')}
            </Button>
            <Button
              to="/register"
              variant="primary"
              size="md"
            >
              {t('header.register')}
            </Button>
          </div>

          {/* Mobile: Register + Menu or Close */}
          <div className="lg:hidden flex items-center gap-2 flex-1 max-w-[300px] justify-end">
            <Button
              to="/register"
              variant="primary"
              className="flex-1 min-w-0 rounded-full h-11"
            >
              <span className="truncate">{t('header.register')}</span>
            </Button>
            <div className="relative" ref={mobileLangRef}>
              <button
                type="button"
                onClick={() => setMobileLangOpen((v) => !v)}
                className="flex items-center justify-center rounded-full h-11 w-11 border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-border)]/20 transition-colors"
                aria-label="Change language"
                aria-expanded={mobileLangOpen}
                aria-haspopup="true"
              >
                <span className="flex h-6 w-6 overflow-hidden rounded-full border border-black/10" aria-hidden>
                  <img
                    src={LANGUAGE_FLAG_SRC[currentLng]}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
              </button>
              {mobileLangOpen && (
                <div
                  className="absolute right-0 top-full mt-2 min-w-[176px] rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg py-1 z-50"
                  role="menu"
                >
                  {supportedLngs.map((lng) => {
                    const isCurrent = currentLng === lng
                    return (
                      <button
                        key={lng}
                        type="button"
                        role="menuitem"
                        onClick={() => selectLanguage(lng)}
                        className={clsx(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm leading-none transition-colors',
                          isCurrent
                            ? 'bg-primary-accent/15 text-primary-accent font-medium'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-border)]/20'
                        )}
                      >
                        <span className="flex h-5 w-5 shrink-0 overflow-hidden rounded-full border border-black/10" aria-hidden>
                          <img
                            src={LANGUAGE_FLAG_SRC[lng]}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </span>
                        <span className="flex-1 truncate leading-tight">{LANGUAGE_LABELS[lng]}</span>
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
                  <Button
                    to="/login"
                    variant="secondary"
                    onClick={closeMenu}
                    className="flex-1"
                  >
                    {t('header.login')}
                  </Button>
                  <Button
                    to="/register"
                    variant="primary"
                    onClick={closeMenu}
                    className="flex-1"
                  >
                    {t('header.register')}
                  </Button>
                </div>
                {(showGoogleAuth || showYandexAuth) && (
                  <div className="pt-3">
                    <LandingSocialAuthLinks onNavigate={closeMenu} />
                  </div>
                )}
              </nav>
              <div className="p-4 border-t border-[var(--color-border)] flex items-center gap-3">
                <LanguageMenu placement="top" />
              </div>
            </aside>
          </>,
          document.body
        )}
    </header>
  )
}
