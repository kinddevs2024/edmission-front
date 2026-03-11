import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

const COOKIE_CONSENT_KEY = 'edmission_cookie_consent'

export function CookieConsentBanner() {
  const { t } = useTranslation('landing')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (value !== 'accepted' && value !== 'rejected') setVisible(true)
  }, [])

  const save = (choice: 'accepted' | 'rejected') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-card)] safe-area-pb"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="min-w-0 flex-1">
          <p id="cookie-title" className="font-semibold text-[var(--color-text)]">
            {t('cookie.title')}
          </p>
          <p id="cookie-desc" className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t('cookie.description')}{' '}
            <Link to="/privacy" className="text-primary-accent underline hover:no-underline">
              {t('cookie.learnMore')}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => save('rejected')}
          >
            {t('cookie.reject')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => save('accepted')}
          >
            {t('cookie.accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
