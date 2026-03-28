import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { navigateAfterLogin, navigateAfterRegistration } from '@/utils/navigateAfterAuth'
import { showOAuthPasswordReminder } from '@/utils/oauthPasswordToast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginWithYandex } from '@/services/auth'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { decodeYandexOAuthState, getYandexRedirectUri } from '@/utils/yandexOAuth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
export function YandexCallback() {
  const { t, i18n } = useTranslation(['common', 'auth', 'errors'])
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const oauthError = params.get('error')
    const oauthDesc = params.get('error_description')
    if (oauthError) {
      setError(oauthDesc || oauthError)
      setLoading(false)
      return
    }

    const code = params.get('code')
    const stateRaw = params.get('state')
    if (!code || !stateRaw) {
      setError(t('auth:yandexMissingParams', 'Missing authorization code. Try signing in again.'))
      setLoading(false)
      return
    }

    const parsed = decodeYandexOAuthState(stateRaw)
    if (!parsed) {
      setError(t('auth:yandexStateInvalid', 'Session expired. Please try again.'))
      setLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const { user } = await loginWithYandex({
          code,
          redirectUri: getYandexRedirectUri(),
          role: parsed.role,
          acceptTerms: parsed.acceptTerms,
        })
        if (cancelled) return

        if (user.mustSetLocalPassword) {
          showOAuthPasswordReminder(t('auth:oauthPasswordToastTitle'), t('auth:oauthPasswordToastDesc'))
        }

        if (parsed.flow === 'register') {
          await navigateAfterRegistration(navigate, user, i18n, { replace: true })
        } else {
          navigateAfterLogin(navigate, user, { replace: true })
        }
      } catch (err) {
        if (cancelled) return
        const apiErr = getApiError(err)
        const errList = apiErr.errors as Array<{ field?: string; message?: string }> | undefined
        const firstMsg = Array.isArray(errList) && errList[0]?.message ? errList[0].message : null
        setError(firstMsg ?? apiErr.message ?? t(`errors:${getApiErrorKey(err)}`))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [params, navigate, t, i18n])

  if (loading) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <CardTitle className="mb-2">{t('auth:yandexCompleting', 'Signing in with Yandex…')}</CardTitle>
        <div className="flex justify-center py-6" aria-hidden>
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <CardTitle className="mb-2">{t('common:login')}</CardTitle>
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <Button to="/login" className="w-full">
          {t('auth:backToLogin', 'Back to login')}
        </Button>
      </Card>
    )
  }

  return null
}
