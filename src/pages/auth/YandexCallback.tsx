import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginWithYandex } from '@/services/auth'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { decodeYandexOAuthState, getYandexRedirectUri } from '@/utils/yandexOAuth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import i18n, { loadLanguage } from '@/i18n'
import { isBrowserLanguageSupported, getBrowserPreferredLanguage, STORAGE_KEY } from '@/i18n/config'

export function YandexCallback() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
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

        if ((user as { mustChangePassword?: boolean }).mustChangePassword) {
          navigate('/set-password', { replace: true })
          return
        }

        if (parsed.flow === 'register') {
          const nextUrl = user.role === 'student' ? '/student/dashboard' : '/university/select'
          if (isBrowserLanguageSupported()) {
            const lng = getBrowserPreferredLanguage()
            await loadLanguage(lng)
            i18n.changeLanguage(lng)
            try {
              localStorage.setItem(STORAGE_KEY, lng)
            } catch {
              /* ignore */
            }
            navigate(nextUrl, { replace: true })
          } else {
            navigate(`/choose-language?next=${encodeURIComponent(nextUrl)}`, { replace: true })
          }
          return
        }

        if (user.role === 'student') navigate('/student/dashboard', { replace: true })
        else if (user.role === 'university') {
          const up = (user as { universityProfile?: { id?: string; verified?: boolean } }).universityProfile
          if (!up?.id) navigate('/university/select', { replace: true })
          else navigate(up.verified ? '/university/dashboard' : '/university/pending', { replace: true })
        } else if (user.role === 'school_counsellor') navigate('/school/dashboard', { replace: true })
        else navigate('/admin', { replace: true })
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
  }, [params, navigate, t])

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
