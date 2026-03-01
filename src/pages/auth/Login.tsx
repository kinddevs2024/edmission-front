import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '@/services/auth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

type FormData = { email: string; password: string }

export function Login() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

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
      if (user.role === 'student') navigate('/student/dashboard')
      else if (user.role === 'university') navigate('/university/dashboard')
      else navigate('/admin')
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
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
