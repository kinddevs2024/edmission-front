import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { Card, CardTitle } from '@/components/ui/Card'

type Mode = 'login' | 'register'
type Role = 'student' | 'university'

function isAllowedReturnUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'edmission:'
  } catch {
    return false
  }
}

function buildReturnUrl(raw: string, params: Record<string, string>): string {
  const u = new URL(raw)
  Object.entries(params).forEach(([key, value]) => u.searchParams.set(key, value))
  return u.toString()
}

export function GoogleMobileCallback() {
  const { t } = useTranslation(['auth', 'common'])
  const [search] = useSearchParams()
  const [error, setError] = useState('')

  const returnUrl = search.get('returnUrl') ?? ''
  const mode = (search.get('mode') === 'register' ? 'register' : 'login') as Mode
  const role = (search.get('role') === 'university' ? 'university' : 'student') as Role
  const acceptTerms = search.get('acceptTerms') === '1'

  const canProceed = useMemo(() => {
    if (!isAllowedReturnUrl(returnUrl)) return false
    if (mode !== 'register') return true
    return acceptTerms
  }, [acceptTerms, mode, returnUrl])

  useEffect(() => {
    if (isAllowedReturnUrl(returnUrl)) return
    setError('Invalid return url')
  }, [returnUrl])

  const onCredential = async (credential: string) => {
    if (!credential) return
    const target = buildReturnUrl(returnUrl, {
      idToken: credential,
      mode,
      role,
    })
    window.location.replace(target)
  }

  const onCancel = () => {
    const target = buildReturnUrl(returnUrl, { error: 'cancelled' })
    window.location.replace(target)
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <CardTitle className="mb-2">
        {t('auth:continueWithGoogle')}
      </CardTitle>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        {t('auth:googleMobileFlowHint', 'Continue with Google, then we will return you to the app.')}
      </p>
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="space-y-3">
          <GoogleSignInButton disabled={!canProceed} onCredential={(c) => void onCredential(c)} />
          <button
            type="button"
            className="w-full text-sm text-[var(--color-text-muted)] hover:underline"
            onClick={onCancel}
          >
            {t('common:cancel', 'Cancel')}
          </button>
          {mode === 'register' && !acceptTerms ? (
            <p className="text-xs text-red-500">
              {t('auth:oauthRegisterHint')}
            </p>
          ) : null}
        </div>
      )}
    </Card>
  )
}
