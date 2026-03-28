import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register as registerApi, verifyEmailByCode, resendVerificationCode, loginWithGoogle } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { navigateAfterRegistration } from '@/utils/navigateAfterAuth'
import { showOAuthPasswordReminder } from '@/utils/oauthPasswordToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardTitle } from '@/components/ui/Card'
import { GraduationCap, Building2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { YandexSignInButton } from '@/components/auth/YandexSignInButton'

export function Register() {
  const { t, i18n } = useTranslation(['common', 'auth', 'errors'])
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [pendingEmail, setPendingEmail] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resendLoading, setResendLoading] = useState(false)

  const schema = useMemo(
    () =>
      z
        .object({
          email: z.string().email(t('auth:invalidEmail')),
          password: z
            .string()
            .min(8, t('auth:passwordMinLength'))
            .refine((p) => /[A-Z]/.test(p), t('auth:passwordUppercase', 'At least one uppercase letter'))
            .refine((p) => /[a-z]/.test(p), t('auth:passwordLowercase', 'At least one lowercase letter'))
            .refine((p) => /\d/.test(p), t('auth:passwordNumber', 'At least one number')),
          confirmPassword: z.string(),
          role: z.enum(['student', 'university']),
          acceptTerms: z.boolean().refine((v) => v === true, { message: t('auth:acceptTermsRequired') }),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t('auth:passwordsMustMatch'),
          path: ['confirmPassword'],
        }),
    [t]
  )
  type FormData = z.infer<typeof schema>

  const showGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim())
  const showYandexAuth = Boolean(import.meta.env.VITE_YANDEX_CLIENT_ID?.trim())
  const showOAuthAuth = showGoogleAuth || showYandexAuth

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student', acceptTerms: false },
  })
  const role = watch('role')

  // Resend cooldown: 60s after entering code step or after successful resend
  useEffect(() => {
    if (step !== 'code' || resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [step, resendCooldown])

  const handleGoogleCredential = async (credential: string) => {
    if (!getValues('acceptTerms')) {
      setSubmitError(t('auth:acceptTermsRequired'))
      return
    }
    setSubmitError('')
    setLoading(true)
    try {
      const data = await loginWithGoogle({
        idToken: credential,
        role: getValues('role'),
        acceptTerms: true,
      })
      if (data.user.mustSetLocalPassword) {
        showOAuthPasswordReminder(t('auth:oauthPasswordToastTitle'), t('auth:oauthPasswordToastDesc'))
      }
      await navigateAfterRegistration(navigate, data.user, i18n)
    } catch (err) {
      const apiErr = getApiError(err)
      const errList = apiErr.errors as Array<{ field?: string; message?: string }> | undefined
      const firstMsg = Array.isArray(errList) && errList[0]?.message ? errList[0].message : null
      setSubmitError(firstMsg ?? apiErr.message ?? t(`errors:${getApiErrorKey(err)}`))
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setCodeError('')
    try {
      await resendVerificationCode(pendingEmail)
      setResendCooldown(60)
    } catch (err) {
      const apiErr = getApiError(err)
      setCodeError(apiErr.message ?? t('errors:unknown'))
    } finally {
      setResendLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitError('')
    setLoading(true)
    try {
      const result = await registerApi({
        email: data.email,
        password: data.password,
        role: data.role,
        acceptTerms: true,
      })
      if ('needsVerification' in result && result.needsVerification) {
        setPendingEmail(result.email)
        setStep('code')
      } else if ('user' in result && result.user) {
        await navigateAfterRegistration(navigate, result.user, i18n)
      }
    } catch (err) {
      const apiErr = getApiError(err)
      const errList = apiErr.errors as Array<{ field?: string; message?: string }> | undefined
      const firstMsg = Array.isArray(errList) && errList[0]?.message ? errList[0].message : null
      setSubmitError(firstMsg ?? t(`errors:${getApiErrorKey(err)}`))
    } finally {
      setLoading(false)
    }
  }

  const onVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const codeInput = form.elements.namedItem('code') as HTMLInputElement
    const code = codeInput?.value?.trim().replace(/\D/g, '').slice(0, 6)
    if (!code || code.length !== 6) {
      setCodeError(t('auth:enterCode') + ' – 6 digits')
      return
    }
    setCodeError('')
    setCodeLoading(true)
    try {
      const result = await verifyEmailByCode(pendingEmail, code)
      await navigateAfterRegistration(navigate, result.user, i18n)
    } catch (err) {
      const apiErr = getApiError(err)
      setCodeError(apiErr.message ?? t('errors:unknown'))
    } finally {
      setCodeLoading(false)
    }
  }

  if (step === 'code') {
    return (
      <Card className="p-6">
        <CardTitle className="mb-2">{t('auth:verifyEmail')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {t('auth:verificationCodeSent', { email: pendingEmail })}
        </p>
        <form onSubmit={onVerifyCode} className="space-y-4">
          <Input
            label={t('auth:enterCode')}
            name="code"
            placeholder={t('auth:codePlaceholder')}
            maxLength={6}
            autoComplete="one-time-code"
            error={codeError}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6)
              e.target.value = v
              setCodeError('')
            }}
          />
          <Button
            type="submit"
            className="w-full"
            loading={codeLoading}
            disabled={codeLoading}
          >
            {t('auth:verifyAndContinue')}
          </Button>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="text-sm text-[var(--color-text-muted)] hover:underline"
            >
              ← {t('common:back')}
            </button>
            {resendCooldown > 0 ? (
              <span className="text-sm text-[var(--color-text-muted)]">
                {t('auth:resendIn', { seconds: resendCooldown })}
              </span>
            ) : (
              <button
                type="button"
                onClick={onResend}
                disabled={resendLoading}
                className="text-sm text-primary-accent hover:underline disabled:opacity-50"
              >
                {resendLoading ? t('common:loading') : t('auth:resendCode')}
              </button>
            )}
          </div>
        </form>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-4">{t('common:register')}</CardTitle>
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
          autoComplete="new-password"
          hint={t('auth:passwordRequirements', '8+ chars, uppercase, lowercase, number')}
          error={errors.password?.message}
          passwordVisible={showPassword}
          onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
          showPasswordToggle
          {...register('password')}
        />
        <Input
          label={t('auth:confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          passwordVisible={showPassword}
          onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
          showPasswordToggle
          {...register('confirmPassword')}
        />
        <div>
          <p className="text-sm font-medium text-[var(--color-text)] mb-2">{t('auth:roleChoice')}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue('role', 'student', { shouldValidate: true })}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 rounded-card border-2 px-2 py-3 text-sm transition-all',
                role === 'student'
                  ? 'border-primary-accent bg-primary-accent/10'
                  : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <GraduationCap className="h-6 w-6 shrink-0 text-primary-accent" aria-hidden />
              <span className="font-medium text-center leading-tight text-[var(--color-text)]">{t('auth:student')}</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'university', { shouldValidate: true })}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 rounded-card border-2 px-2 py-3 text-sm transition-all',
                role === 'university'
                  ? 'border-primary-accent bg-primary-accent/10'
                  : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <Building2 className="h-6 w-6 shrink-0 text-primary-accent" aria-hidden />
              <span className="font-medium text-center leading-tight text-[var(--color-text)]">{t('auth:university')}</span>
            </button>
          </div>
          <input type="hidden" {...register('role')} />
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            {...register('acceptTerms')}
            label={
              <span className="text-sm text-[var(--color-text)]">
                {t('auth:acceptTerms')}{' '}
                <Link to="/privacy" className="text-primary-accent underline hover:no-underline">
                  {t('common:privacy')}
                </Link>
              </span>
            }
          />
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
        )}
        {showOAuthAuth && (
          <div className="space-y-2 pt-1">
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <span className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="bg-[var(--color-card)] px-3 text-[var(--color-text-muted)]">
                  {t('auth:orDivider')}
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {showGoogleAuth && showYandexAuth
                ? t('auth:oauthRegisterHint', 'Accept the terms above, then continue with Google or Yandex.')
                : showYandexAuth
                  ? t('auth:yandexRegisterHint', 'Accept the terms above, then continue with Yandex.')
                  : t('auth:googleRegisterHint')}
            </p>
            {showGoogleAuth && (
              <GoogleSignInButton
                disabled={loading || !watch('acceptTerms')}
                onCredential={(c) => void handleGoogleCredential(c)}
              />
            )}
            {showYandexAuth && (
              <div
                className={
                  watch('acceptTerms')
                    ? 'transition-opacity'
                    : 'pointer-events-none opacity-60 saturate-50 transition-opacity'
                }
              >
                <YandexSignInButton
                  disabled={loading}
                  role={role}
                  acceptTerms={watch('acceptTerms')}
                  flow="register"
                  onBusyChange={setLoading}
                  onError={(msg) => setSubmitError(msg)}
                  onSuccess={async () => {
                    setSubmitError('')
                    const user = useAuthStore.getState().user
                    if (user) {
                      if (user.mustSetLocalPassword) {
                        showOAuthPasswordReminder(t('auth:oauthPasswordToastTitle'), t('auth:oauthPasswordToastDesc'))
                      }
                      await navigateAfterRegistration(navigate, user, i18n)
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          {t('common:register')}
        </Button>
        <Link
          to="/login"
          className="block text-sm text-[var(--color-text-muted)] hover:underline text-center"
        >
          {t('auth:haveAccount')} {t('common:login')}
        </Link>
        <Link
          to="/"
          className="block text-sm text-[var(--color-text-muted)] hover:underline text-center mt-1"
        >
          {t('common:home')}
        </Link>
      </form>
    </Card>
  )
}
