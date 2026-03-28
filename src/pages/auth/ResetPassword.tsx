import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPassword } from '@/services/auth'
import { getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { newPasswordValueSchema } from '@/utils/authPasswordZod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'
import i18n, { loadLanguage } from '@/i18n'
import { isBrowserLanguageSupported, getBrowserPreferredLanguage, STORAGE_KEY } from '@/i18n/config'

type FormData = { newPassword: string; confirmPassword: string }

export function ResetPassword() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const schema = useMemo(
    () =>
      z
        .object({
          newPassword: newPasswordValueSchema({
            min: t('auth:passwordMinLength'),
            uppercase: t('auth:passwordUppercase'),
            lowercase: t('auth:passwordLowercase'),
            number: t('auth:passwordNumber'),
          }),
          confirmPassword: z.string(),
        })
        .refine((d) => d.newPassword === d.confirmPassword, {
          message: t('auth:passwordsMustMatch'),
          path: ['confirmPassword'],
        }),
    [t]
  )

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const token = searchParams.get('token')

  const onSubmit = async (data: FormData) => {
    if (!token) return
    setSubmitError('')
    setLoading(true)
    try {
      await resetPassword(token, data.newPassword)
      setSuccess(true)
      if (isBrowserLanguageSupported()) {
        const lng = getBrowserPreferredLanguage()
        await loadLanguage(lng)
        i18n.changeLanguage(lng)
        try {
          localStorage.setItem(STORAGE_KEY, lng)
        } catch {
          /* ignore */
        }
        navigate('/login', { replace: true })
      } else {
        navigate('/choose-language?next=/login', { replace: true })
      }
    } catch (err) {
      setSubmitError(getFormSubmitErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Card className="p-6">
        <CardTitle className="mb-2 text-red-500">{t('errors:invalidToken')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">{t('auth:forgotPassword')}</p>
        <Link to="/forgot-password" className="text-primary-accent hover:underline">{t('common:back')}</Link>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="p-6">
        <CardTitle className="mb-2">{t('auth:resetPassword')}</CardTitle>
        <p className="text-[var(--color-text-muted)] mb-4">{t('common:redirecting', 'Redirecting...')}</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-4">{t('auth:resetPassword')}</CardTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth:newPassword')}
          type="password"
          autoComplete="new-password"
          hint={t('auth:passwordRequirements')}
          error={errors.newPassword?.message}
          passwordVisible={showPassword}
          onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
          showPasswordToggle
          {...register('newPassword')}
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
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>{t('common:submit')}</Button>
        <Link to="/login" className="block text-sm text-[var(--color-text-muted)] hover:underline text-center">
          {t('common:back')}
        </Link>
      </form>
    </Card>
  )
}
