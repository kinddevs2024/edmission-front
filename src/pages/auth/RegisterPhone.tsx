import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { startPhoneRegistration, getPhoneRegistrationStatus, completePhoneRegistration } from '@/services/auth'
import { navigateAfterRegistration } from '@/utils/navigateAfterAuth'
import { getApiError } from '@/services/api'

type Step = 'form' | 'verify'

export function RegisterPhone() {
  const { t, i18n } = useTranslation(['common', 'auth', 'errors'])
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrationId, setRegistrationId] = useState('')
  const [deepLink, setDeepLink] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  const schema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          phone: z.string().min(7, 'Phone is required'),
          password: z.string().min(8, 'Password must be at least 8 characters'),
          confirmPassword: z.string(),
          role: z.enum(['student', 'university']),
          acceptTerms: z.boolean().refine((v) => v === true, { message: t('auth:acceptTermsRequired') }),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t('auth:passwordsMustMatch'),
          path: ['confirmPassword'],
        }),
    [t]
  )

  type FormData = z.infer<typeof schema>

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student', acceptTerms: false },
  })

  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    setError('')
    setLoading(true)
    try {
      const result = await startPhoneRegistration({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
        role: data.role,
        acceptTerms: true,
      })
      setRegistrationId(result.registrationId)
      setDeepLink(result.verification.deepLink)
      setStep('verify')
    } catch (e) {
      setError(getApiError(e).message || t('errors:default'))
    } finally {
      setLoading(false)
    }
  }

  const onConfirmed = async () => {
    if (!registrationId) return
    setVerifyLoading(true)
    setError('')
    try {
      const status = await getPhoneRegistrationStatus(registrationId)
      if (!status.verifiedViaTelegram) {
        setError('Подтверждение в Telegram еще не найдено. Нажмите Start у бота и попробуйте снова.')
        return
      }
      const result = await completePhoneRegistration(registrationId)
      await navigateAfterRegistration(navigate, result.user, i18n)
    } catch (e) {
      setError(getApiError(e).message || t('errors:default'))
    } finally {
      setVerifyLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <Card className="p-6">
        <CardTitle className="mb-2">Подтверждение в Telegram</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Нажми кнопку ниже, открой бота и нажми Start.
        </p>
        {deepLink ? (
          <a href={deepLink} target="_blank" rel="noreferrer" className="block mb-4 text-primary-accent underline">
            Открыть Telegram-бота
          </a>
        ) : null}
        {error ? <p className="text-sm text-red-500 mb-3">{error}</p> : null}
        <Button className="w-full" onClick={() => void onConfirmed()} loading={verifyLoading} disabled={verifyLoading}>
          Я подтвердил в Telegram
        </Button>
        <button type="button" className="mt-3 text-sm text-[var(--color-text-muted)] hover:underline" onClick={() => setStep('form')}>
          Назад
        </button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-3">Регистрация по номеру</CardTitle>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Введи данные, подтверди Telegram и сразу попадешь в профиль.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Имя" error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Фамилия" error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Номер телефона" placeholder="+998..." error={errors.phone?.message} {...register('phone')} />
        <Input label={t('auth:password')} type="password" error={errors.password?.message} {...register('password')} />
        <Input label={t('auth:confirmPassword')} type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setValue('role', 'student', { shouldValidate: true })} className={role === 'student' ? 'rounded-card border-2 border-primary-accent px-3 py-2' : 'rounded-card border px-3 py-2'}>Student</button>
          <button type="button" onClick={() => setValue('role', 'university', { shouldValidate: true })} className={role === 'university' ? 'rounded-card border-2 border-primary-accent px-3 py-2' : 'rounded-card border px-3 py-2'}>University</button>
          <input type="hidden" {...register('role')} />
        </div>
        <Checkbox {...register('acceptTerms')} label={<span className="text-sm">Согласен с условиями</span>} />
        {errors.acceptTerms ? <p className="text-sm text-red-500">{errors.acceptTerms.message}</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Зарегистрироваться
        </Button>
        <div className="text-sm text-center">
          <Link to="/register" className="text-[var(--color-text-muted)] hover:underline">Регистрация по email</Link>
        </div>
      </form>
    </Card>
  )
}

export default RegisterPhone
