import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword, resetPasswordWithTelegramCode } from '@/services/auth'
import { getApiErrorKey, getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { newPasswordValueSchema } from '@/utils/authPasswordZod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

type FormData = { email: string }

export function ForgotPassword() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const [sent, setSent] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const [telegramPhone, setTelegramPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const schema = z.object({ email: z.string().min(1, t('auth:loginRequired', 'Enter email or phone.')) })
  const passwordSchema = useMemo(
    () =>
      newPasswordValueSchema({
        min: t('auth:passwordMinLength'),
        uppercase: t('auth:passwordUppercase'),
        lowercase: t('auth:passwordLowercase'),
        number: t('auth:passwordNumber'),
      }),
    [t],
  )
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    setLoading(true)
    try {
      const result = await forgotPassword(data.email)
      setResetLink(result.resetLink ?? '')
      setTelegramPhone(result.mode === 'telegram_code' ? result.phone ?? data.email : '')
      setSent(true)
    } catch (err) {
      const key = getApiErrorKey(err)
      setError(t(`errors:${key}`))
    } finally {
      setLoading(false)
    }
  }

  const onSubmitTelegramCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6)
    if (normalizedCode.length !== 6) {
      setError(t('auth:codeInvalid', 'Enter the full 6-digit code.'))
      return
    }
    const parsed = passwordSchema.safeParse(newPassword)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('auth:passwordRequirements'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth:passwordsMustMatch'))
      return
    }
    setLoading(true)
    try {
      await resetPasswordWithTelegramCode({
        phone: telegramPhone,
        code: normalizedCode,
        newPassword,
      })
      setTelegramPhone('')
      setSent(true)
    } catch (err) {
      setError(getFormSubmitErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    if (telegramPhone) {
      return (
        <Card className="p-6">
          <CardTitle className="mb-2">{t('auth:resetPassword', 'Reset password')}</CardTitle>
          <p className="text-[var(--color-text-muted)] mb-4">
            {t('auth:phoneCodeSentHint', 'A code was sent to your Telegram bot. Enter it and create a new password.')}
          </p>
          <form onSubmit={onSubmitTelegramCode} className="space-y-4">
            <Input
              label={t('auth:enterCode', 'Enter code')}
              value={code}
              maxLength={6}
              autoComplete="one-time-code"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <Input
              label={t('auth:newPassword')}
              type="password"
              autoComplete="new-password"
              hint={t('auth:passwordRequirements')}
              value={newPassword}
              passwordVisible={showPassword}
              onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
              showPasswordToggle
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label={t('auth:confirmPassword')}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              passwordVisible={showPassword}
              onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
              showPasswordToggle
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" loading={loading} disabled={loading}>{t('common:submit')}</Button>
            <Link to="/login" className="block text-sm text-[var(--color-text-muted)] hover:underline text-center">
              {t('common:back')}
            </Link>
          </form>
        </Card>
      )
    }
    return (
      <Card className="p-6">
        <CardTitle className="mb-2">{t('auth:resetPassword', 'Reset password')}</CardTitle>
        <p className="text-[var(--color-text-muted)] mb-4">
          {t('auth:resetPasswordSent')}
        </p>
        {resetLink && (
          <p className="mb-4 break-all text-sm text-[var(--color-text-muted)]">
            Dev reset link:{' '}
            <a href={resetLink} className="text-primary-accent hover:underline">
              {resetLink}
            </a>
          </p>
        )}
        <Link to="/login" className="text-primary-accent hover:underline">{t('common:back')}</Link>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-4">{t('auth:forgotPassword')}</CardTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth:emailOrPhone', 'Email or phone')}
          type="text"
          autoComplete="username"
          placeholder={t('auth:emailOrPhonePlaceholder', 'email@example.com or +998...')}
          error={errors.email?.message}
          {...register('email')}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>{t('common:submit')}</Button>
        <Link to="/login" className="block text-sm text-[var(--color-text-muted)] hover:underline text-center">
          {t('common:back')}
        </Link>
      </form>
    </Card>
  )
}
