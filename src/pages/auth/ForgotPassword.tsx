import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword, getApiError } from '@/services/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

const schema = z.object({ email: z.string().email() })
type FormData = z.infer<typeof schema>

export function ForgotPassword() {
  const { t } = useTranslation(['common', 'auth'])
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await forgotPassword(data.email)
      setSent(true)
    } catch (err) {
      setError(getApiError(err).message)
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
        <Input label={t('auth:email')} type="email" {...register('email')} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full">{t('common:submit')}</Button>
        <Link to="/login" className="block text-sm text-[var(--color-text-muted)] hover:underline text-center">
          {t('common:back')}
        </Link>
      </form>
    </Card>
  )
}
