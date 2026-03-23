import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login, loginWithGoogle } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import type { User } from '@/types/user'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { YandexSignInButton } from '@/components/auth/YandexSignInButton'

type FormData = { email: string; password: string }

function navigateAfterLogin(navigate: ReturnType<typeof useNavigate>, user: User) {
  if (user.mustChangePassword) {
    navigate('/set-password')
    return
  }
  if (user.role === 'student') navigate('/student/dashboard')
  else if (user.role === 'university') {
    const up = user.universityProfile
    if (!up?.id) navigate('/university/select')
    else navigate(up.verified ? '/university/dashboard' : '/university/pending')
  } else if (user.role === 'school_counsellor') navigate('/school/dashboard')
  else navigate('/admin')
}

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
      <CardTitle className="mb-4">{t('common:appName')} — {t('common:login')}</CardTitle>
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
            {t('common:login')}
          </Button>
          <Link to="/forgot-password" className="text-sm text-primary-accent hover:underline">
            {t('auth:forgotPassword')}
          </Link>
          <Link to="/register" className="text-sm text-[var(--color-text-muted)] hover:underline">
            {t('auth:noAccount')} {t('common:register')}
          </Link>
          <Link to="/" className="text-sm text-[var(--color-text-muted)] hover:underline">
            {t('common:home')}
          </Link>
        </div>
      </form>

      {showOAuthAuth && (
        <div className="mt-6 space-y-4 pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-center text-[var(--color-text-muted)]">
            {showGoogleAuth && showYandexAuth
              ? t('auth:oauthLoginHint', 'By continuing you agree to our Terms and Privacy Policy.')
              : showYandexAuth
                ? t('auth:yandexLoginHint', 'By continuing with Yandex you agree to our Terms and Privacy Policy.')
                : t('auth:googleLoginHint')}
          </p>
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
                if (user) navigateAfterLogin(navigate, user)
              }}
            />
          )}
        </div>
      )}
    </Card>
  )
}
