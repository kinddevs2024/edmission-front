import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { LanguageMenu } from '@/components/layout/LanguageMenu'

export function LandingHeader() {
  const { t } = useTranslation('landing')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

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
        <Link to="/" className="text-lg font-semibold text-[var(--color-text)]">
          Edmission
        </Link>
        <nav className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => scrollTo('how-it-works')}
            className="hidden text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] sm:block"
          >
            {t('header.howItWorks')}
          </button>
          <button
            type="button"
            onClick={() => scrollTo('for-universities')}
            className="hidden text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] sm:block"
          >
            {t('header.forUniversities')}
          </button>
          <button
            type="button"
            onClick={() => scrollTo('faq')}
            className="hidden text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] sm:block"
          >
            {t('header.faq')}
          </button>
          <Link
            to="/login"
            className="rounded-input border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-card)]"
          >
            {t('header.login')}
          </Link>
          <Link
            to="/register"
            className="rounded-input bg-primary-accent px-3 py-2 text-sm font-medium text-primary-dark hover:opacity-90"
          >
            {t('header.register')}
          </Link>
          <LanguageMenu />
        </nav>
      </div>
    </header>
  )
}
