import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login, loginWithGoogle } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { navigateAfterLogin } from '@/utils/navigateAfterAuth'
import { showOAuthPasswordReminder } from '@/utils/oauthPasswordToast'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { YandexSignInButton } from '@/components/auth/YandexSignInButton'
import { BrandMark } from '@/components/layout/BrandLogo'

type FormData = { email: string; password: string }

export function Login() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const showGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim())
  const showYandexAuth = Boolean(import.meta.env.VITE_YANDEX_CLIENT_ID?.trim())
  const showOAuthAuth = showGoogleAuth || showYandexAuth

  const schema = z.object({
    email: z.string().email(t('auth:invalidEmail')),
    password: z.string().min(1, t('auth:passwordRequired')),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitError('')
    setLoading(true)
    try {
      const { user } = await login(data)
      navigateAfterLogin(navigate, user)
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (credential: string) => {
    setSubmitError('')
    setLoading(true)
    try {
      const { user } = await loginWithGoogle({
        idToken: credential,
        acceptTerms: true,
      })
      if (user.mustSetLocalPassword) {
        showOAuthPasswordReminder(
          t('auth:oauthPasswordToastTitle'),
          t('auth:oauthPasswordToastDesc')
        )
      }
      navigateAfterLogin(navigate, user)
    } catch (err) {
      const apiErr = getApiError(err)
      const key = getApiErrorKey(err)
      setSubmitError(key !== 'default' ? t(`errors:${key}`) : apiErr.message || t('errors:default'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <BrandMark className="h-14 w-14" />
        <CardTitle>sing-in to Edmission</CardTitle>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth:email')}
          type="email"
          autoComplete="email"
          placeholder={t('auth:emailPlaceholder')}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label={t('auth:password')}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            Sign in
          </Button>
          <Link to="/login-phone" className="text-sm text-center text-primary-accent hover:underline">
            Войти по номеру телефона
          </Link>
          <div className="flex items-center justify-between gap-3">
            <Link to="/forgot-password" className="text-sm text-primary-accent hover:underline">
              {t('auth:forgotPassword')}
            </Link>
            <Link to="/register" className="text-xs text-[var(--color-text-muted)] hover:underline text-right">
              {t('auth:noAccountShort', 'No account?')} {t('common:register')}
            </Link>
          </div>
        </div>
      </form>

      {showOAuthAuth && (
        <div className="mt-6 space-y-4 pt-6 border-t border-[var(--color-border)]">
          {showGoogleAuth && (
            <GoogleSignInButton disabled={loading} onCredential={(c) => void handleGoogleCredential(c)} />
          )}
          {showYandexAuth && (
            <YandexSignInButton
              disabled={loading}
              acceptTerms
              flow="login"
              onBusyChange={setLoading}
              onError={(msg) => setSubmitError(msg)}
              onSuccess={() => {
                setSubmitError('')
                const user = useAuthStore.getState().user
                if (user) {
                  if (user.mustSetLocalPassword) {
                    showOAuthPasswordReminder(
                      t('auth:oauthPasswordToastTitle'),
                      t('auth:oauthPasswordToastDesc')
                    )
                  }
                  navigateAfterLogin(navigate, user)
                }
              }}
            />
          )}
        </div>
      )}
    </Card>
  )
}
