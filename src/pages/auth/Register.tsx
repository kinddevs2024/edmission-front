import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register as registerApi, getApiError } from '@/services/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string(),
  name: z.string().min(1),
  role: z.enum(['student', 'university']),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export function Register() {
  const { t } = useTranslation(['common', 'auth'])
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  })
  watch('role')

  const onSubmit = async (data: FormData) => {
    setSubmitError('')
    try {
      const { user } = await registerApi({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      })
      if (user.role === 'student') navigate('/student/dashboard')
      else navigate('/university/dashboard')
    } catch (err) {
      setSubmitError(getApiError(err).message)
    }
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-4">{t('common:register')}</CardTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('auth:name')} error={errors.name?.message} {...register('name')} />
        <Input label={t('auth:email')} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label={t('auth:password')} type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <Input label={t('auth:confirmPassword')} type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <div>
          <span className="text-sm text-[var(--color-text-muted)] mr-2">{t('auth:registerAs')}</span>
          <label className="inline-flex items-center gap-2 mr-4">
            <input type="radio" value="student" {...register('role')} />
            {t('auth:student')}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" value="university" {...register('role')} />
            {t('auth:university')}
          </label>
        </div>
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" className="w-full">{t('common:register')}</Button>
        <Link to="/login" className="block text-sm text-[var(--color-text-muted)] hover:underline text-center">
          {t('auth:haveAccount')} {t('common:login')}
        </Link>
      </form>
    </Card>
  )
}
