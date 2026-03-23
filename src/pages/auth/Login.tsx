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
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { YandexSignInButton } from '@/components/auth/YandexSignInButton'
import { GraduationCap, Building2 } from 'lucide-react'
import { cn } from '@/utils/cn'

type FormData = { email: string; password: string }

export function Login() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleRole, setGoogleRole] = useState<'student' | 'university'>('student')
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
      if ((user as { mustChangePassword?: boolean }).mustChangePassword) {
        navigate('/set-password')
        return
      }
      if (user.role === 'student') navigate('/student/dashboard')
      else if (user.role === 'university') {
        const up = (user as { universityProfile?: { id?: string; verified?: boolean } }).universityProfile
        if (!up?.id) navigate('/university/select')
        else navigate(up.verified ? '/university/dashboard' : '/university/pending')
      }
      else if (user.role === 'school_counsellor') navigate('/school/dashboard')
      else navigate('/admin')
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
      const data = await loginWithGoogle({
        idToken: credential,
        role: googleRole,
        acceptTerms: true,
      })
      const { user } = data
      if ((user as { mustChangePassword?: boolean }).mustChangePassword) {
        navigate('/set-password')
        return
      }
      if (user.role === 'student') navigate('/student/dashboard')
      else if (user.role === 'university') {
        const up = (user as { universityProfile?: { id?: string; verified?: boolean } }).universityProfile
        if (!up?.id) navigate('/university/select')
        else navigate(up.verified ? '/university/dashboard' : '/university/pending')
      } else if (user.role === 'school_counsellor') navigate('/school/dashboard')
      else navigate('/admin')
    } catch (err) {
      const apiErr = getApiError(err)
      setSubmitError(apiErr.message ?? t(`errors:${getApiErrorKey(err)}`))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-4">{t('common:appName')} — {t('common:login')}</CardTitle>
      {showOAuthAuth && (
        <div className="mb-6 space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            {showGoogleAuth && showYandexAuth
              ? t('auth:oauthLoginHint', 'By continuing you agree to our Terms and Privacy Policy.')
              : showYandexAuth
                ? t('auth:yandexLoginHint', 'By continuing with Yandex you agree to our Terms and Privacy Policy.')
                : t('auth:googleLoginHint')}
          </p>
          <p className="text-xs font-medium text-[var(--color-text)]">{t('auth:registerAs')}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGoogleRole('student')}
              className={cn(
                'flex items-center gap-2 rounded-card border-2 px-3 py-2 text-left text-sm transition-all',
                googleRole === 'student'
                  ? 'border-primary-accent bg-primary-accent/10'
                  : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <GraduationCap className="h-5 w-5 shrink-0 text-primary-accent" aria-hidden />
              <span className="font-medium">{t('auth:student')}</span>
            </button>
            <button
              type="button"
              onClick={() => setGoogleRole('university')}
              className={cn(
                'flex items-center gap-2 rounded-card border-2 px-3 py-2 text-left text-sm transition-all',
                googleRole === 'university'
                  ? 'border-primary-accent bg-primary-accent/10'
                  : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <Building2 className="h-5 w-5 shrink-0 text-primary-accent" aria-hidden />
              <span className="font-medium">{t('auth:university')}</span>
            </button>
          </div>
          {showGoogleAuth && (
            <GoogleSignInButton disabled={loading} onCredential={(c) => void handleGoogleCredential(c)} />
          )}
          {showYandexAuth && (
            <YandexSignInButton
              disabled={loading}
              role={googleRole}
              acceptTerms
              flow="login"
              onBusyChange={setLoading}
              onError={(msg) => setSubmitError(msg)}
              onSuccess={() => {
                setSubmitError('')
                const user = useAuthStore.getState().user
                if (!user) return
                if ((user as { mustChangePassword?: boolean }).mustChangePassword) {
                  navigate('/set-password')
                  return
                }
                if (user.role === 'student') navigate('/student/dashboard')
                else if (user.role === 'university') {
                  const up = (user as { universityProfile?: { id?: string; verified?: boolean } }).universityProfile
                  if (!up?.id) navigate('/university/select')
                  else navigate(up.verified ? '/university/dashboard' : '/university/pending')
                } else if (user.role === 'school_counsellor') navigate('/school/dashboard')
                else navigate('/admin')
              }}
            />
          )}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-[var(--color-card)] px-3 text-[var(--color-text-muted)]">{t('auth:orDivider')}</span>
            </div>
          </div>
        </div>
      )}
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
          <Button type="submit" className="w-full" loading={loading} disabled={loading}>{t('common:login')}</Button>
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
    </Card>
  )
}
