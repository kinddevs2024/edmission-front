import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { setPassword, getProfile } from '@/services/auth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

type FormData = { newPassword: string; confirmPassword: string }

export function SetPassword() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const schema = z.object({
    newPassword: z.string().min(8, t('auth:passwordMinLength')),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, { message: t('auth:passwordsMustMatch'), path: ['confirmPassword'] })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitError('')
    setLoading(true)
    try {
      await setPassword(data.newPassword)
      const user = await getProfile()
      if (user.role === 'student') navigate('/student/dashboard', { replace: true })
      else if (user.role === 'university') {
        const verified = (user as { universityProfile?: { verified?: boolean } }).universityProfile?.verified
        navigate(verified ? '/university/dashboard' : '/university/pending', { replace: true })
      } else navigate('/admin', { replace: true })
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-4">{t('auth:setPassword', 'Set your password')}</CardTitle>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        {t('auth:setPasswordHint', 'You need to set a new password to continue. Use a strong password.')}
      </p>
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
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          {t('common:save', 'Save')}
        </Button>
      </form>
    </Card>
  )
}
