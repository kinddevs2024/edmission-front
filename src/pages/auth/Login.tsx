import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login, getApiError } from '@/services/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const { t } = useTranslation(['common', 'auth'])
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitError('')
    try {
      const { user } = await login(data)
      if (user.role === 'student') navigate('/student/dashboard')
      else if (user.role === 'university') navigate('/university/dashboard')
      else navigate('/admin')
    } catch (err) {
      setSubmitError(getApiError(err).message)
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
          <Button type="submit" className="w-full">{t('common:login')}</Button>
          <Link to="/forgot-password" className="text-sm text-primary-accent hover:underline">
            {t('auth:forgotPassword')}
          </Link>
          <Link to="/register" className="text-sm text-[var(--color-text-muted)] hover:underline">
            {t('auth:noAccount')} {t('common:register')}
          </Link>
          <Link to="/" className="text-sm text-[var(--color-text-muted)] hover:underline">
            На главную
          </Link>
        </div>
      </form>
    </Card>
  )
}
