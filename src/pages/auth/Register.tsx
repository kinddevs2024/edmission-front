import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register as registerApi, verifyEmailByCode } from '@/services/auth'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import i18n, { loadLanguage } from '@/i18n'
import { isBrowserLanguageSupported, getBrowserPreferredLanguage, STORAGE_KEY } from '@/i18n/config'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'
import { GraduationCap, Building2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const passwordSchema = (t: (key: string, def?: string) => string) =>
  z
    .string()
    .min(8, t('auth:passwordMinLength'))
    .refine((p) => /[A-Z]/.test(p), t('auth:passwordUppercase', 'At least one uppercase letter'))
    .refine((p) => /[a-z]/.test(p), t('auth:passwordLowercase', 'At least one lowercase letter'))
    .refine((p) => /\d/.test(p), t('auth:passwordNumber', 'At least one number'))

export function Register() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [pendingEmail, setPendingEmail] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  const schema = z
    .object({
      email: z.string().email(t('auth:invalidEmail')),
      password: passwordSchema(t),
      confirmPassword: z.string(),
      role: z.enum(['student', 'university']),
      acceptTerms: z.boolean().refine((v) => v === true, { message: t('auth:acceptTermsRequired') }),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('auth:passwordsMustMatch'),
      path: ['confirmPassword'],
    })
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student', acceptTerms: false },
  })
  const role = watch('role')

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
        const nextUrl =
          result.user.role === 'student' ? '/student/dashboard' : '/university/select'
        if (isBrowserLanguageSupported()) {
          const lng = getBrowserPreferredLanguage()
          await loadLanguage(lng)
          i18n.changeLanguage(lng)
          try {
            localStorage.setItem(STORAGE_KEY, lng)
          } catch {
            /* ignore */
          }
          navigate(nextUrl)
        } else {
          navigate(`/choose-language?next=${encodeURIComponent(nextUrl)}`)
        }
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
      const nextUrl =
        result.user.role === 'student' ? '/student/dashboard' : '/university/select'
      if (isBrowserLanguageSupported()) {
        const lng = getBrowserPreferredLanguage()
        await loadLanguage(lng)
        i18n.changeLanguage(lng)
        try {
          localStorage.setItem(STORAGE_KEY, lng)
        } catch {
          /* ignore */
        }
        navigate(nextUrl)
      } else {
        navigate(`/choose-language?next=${encodeURIComponent(nextUrl)}`)
      }
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
          <button
            type="button"
            onClick={() => setStep('form')}
            className="block w-full text-sm text-[var(--color-text-muted)] hover:underline"
          >
            ← {t('common:back')}
          </button>
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
          showPasswordToggle={false}
          {...register('confirmPassword')}
        />
        <div>
          <p className="text-sm font-medium text-[var(--color-text)] mb-2">{t('auth:registerAs')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('role', 'student', { shouldValidate: true })}
              className={cn(
                'flex items-center gap-3 p-4 rounded-card border-2 text-left transition-all',
                role === 'student'
                  ? 'border-primary-accent bg-primary-accent/10 shadow-md'
                  : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                  role === 'student'
                    ? 'bg-primary-accent/20 text-primary-accent'
                    : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                )}
              >
                <GraduationCap className="w-6 h-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text)]">{t('auth:student')}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {t('auth:studentRoleHint', 'I am applying to universities')}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'university', { shouldValidate: true })}
              className={cn(
                'flex items-center gap-3 p-4 rounded-card border-2 text-left transition-all',
                role === 'university'
                  ? 'border-primary-accent bg-primary-accent/10 shadow-md'
                  : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                  role === 'university'
                    ? 'bg-primary-accent/20 text-primary-accent'
                    : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                )}
              >
                <Building2 className="w-6 h-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text)]">{t('auth:university')}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {t('auth:universityRoleHint', 'I represent a university')}
                </p>
              </div>
            </button>
          </div>
          <input type="hidden" {...register('role')} />
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('acceptTerms')}
            className="mt-1 rounded border-[var(--color-border)]"
          />
          <span className="text-sm text-[var(--color-text)]">
            {t('auth:acceptTerms')}{' '}
            <Link to="/privacy" className="text-primary-accent underline hover:no-underline">
              {t('common:privacy')}
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
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
