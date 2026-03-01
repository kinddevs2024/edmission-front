import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPassword } from '@/services/auth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

type FormData = { newPassword: string; confirmPassword: string }

export function ResetPassword() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const schema = z.object({
    newPassword: z.string().min(8, t('auth:passwordMinLength')),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, { message: t('auth:passwordsMustMatch'), path: ['confirmPassword'] })

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
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
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
        <p className="text-[var(--color-text-muted)] mb-4">{t('common:signInNow')}</p>
        <Button onClick={() => navigate('/login')}>{t('common:signIn')}</Button>
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
          hint={t('auth:passwordMinLength')}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label={t('auth:confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
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
