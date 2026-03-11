import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

const COOKIE_CONSENT_KEY = 'edmission_cookie_consent'

export function CookieConsentBanner() {
  const { t, i18n } = useTranslation('landing', { useSuspense: true })
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

  const title = t('cookie.title', { defaultValue: 'Cookie notice' })
  const description = t('cookie.description', { defaultValue: 'We use cookies to provide the service and improve the site. By continuing, you agree to our use of cookies.' })
  const learnMore = t('cookie.learnMore', { defaultValue: 'Cookie policy' })
  const rejectLabel = t('cookie.reject', { defaultValue: 'Reject' })
  const acceptLabel = t('cookie.accept', { defaultValue: 'Accept' })

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      lang={i18n.language}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-card)] safe-area-pb"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="min-w-0 flex-1">
          <p id="cookie-title" className="text-base font-semibold text-[var(--color-text)] sm:text-lg">
            {title}
          </p>
          <p id="cookie-desc" className="mt-1 text-sm text-[var(--color-text-muted)] sm:text-base">
            {description}{' '}
            <Link to="/cookies" className="text-primary-accent underline hover:no-underline">
              {learnMore}
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
            {rejectLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => save('accepted')}
          >
            {acceptLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
