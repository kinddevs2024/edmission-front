import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyEmail } from '@/services/auth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function VerifyEmail() {
  const { t } = useTranslation(['common', 'auth'])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      return
    }
    verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [searchParams])

  if (status === 'loading') {
    return (
      <Card className="p-6 flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-[var(--color-primary-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-[var(--color-text-muted)]">{t('common:verifyingEmail')}</p>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="p-6">
        <CardTitle className="mb-2 text-red-500">{t('common:verificationFailed')}</CardTitle>
        <Button onClick={() => navigate('/login')}>{t('common:goToLogin')}</Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-2">{t('common:emailVerified')}</CardTitle>
      <p className="mb-4 text-[var(--color-text-muted)]">{t('common:signInNow')}</p>
      <Button onClick={() => navigate('/login')}>{t('common:signIn')}</Button>
    </Card>
  )
}
