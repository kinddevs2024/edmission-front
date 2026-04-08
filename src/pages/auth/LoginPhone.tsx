import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loginByPhone } from '@/services/auth'
import { navigateAfterLogin } from '@/utils/navigateAfterAuth'
import { getApiError } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

type FormData = { phone: string; password: string }

export function LoginPhone() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const schema = z.object({
    phone: z.string().min(7, 'Phone is required'),
    password: z.string().min(1, t('auth:passwordRequired')),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const { user } = await loginByPhone(data)
      navigateAfterLogin(navigate, user)
    } catch (e) {
      setError(getApiError(e).message || t('errors:default'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-3">Вход по номеру</CardTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Номер телефона" placeholder="+998..." error={errors.phone?.message} {...register('phone')} />
        <Input label={t('auth:password')} type="password" error={errors.password?.message} {...register('password')} />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Войти
        </Button>
        <div className="text-sm text-center">
          <Link to="/login" className="text-[var(--color-text-muted)] hover:underline">Вход по email</Link>
        </div>
      </form>
    </Card>
  )
}

export default LoginPhone
