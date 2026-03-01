import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword } from '@/services/auth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

type FormData = { email: string }

export function ForgotPassword() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const schema = z.object({ email: z.string().email(t('auth:invalidEmail')) })
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    setLoading(true)
    try {
      await forgotPassword(data.email)
      setSent(true)
    } catch (err) {
      const key = getApiErrorKey(err)
      setError(t(`errors:${key}`))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="p-6">
        <CardTitle className="mb-2">{t('auth:verifyEmail')}</CardTitle>
        <p className="text-[var(--color-text-muted)] mb-4">{t('auth:verifyEmailSent')}</p>
        <Link to="/login" className="text-primary-accent hover:underline">{t('common:back')}</Link>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-4">{t('auth:forgotPassword')}</CardTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('auth:email')} type="email" placeholder={t('auth:emailPlaceholder')} error={errors.email?.message} {...register('email')} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>{t('common:submit')}</Button>
        <Link to="/login" className="block text-sm text-[var(--color-text-muted)] hover:underline text-center">
          {t('common:back')}
        </Link>
      </form>
    </Card>
  )
}
