import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { updateProfile } from '@/services/university'
import { getApiError } from '@/services/auth'

const STEPS: { id: number; titleKey: string }[] = [
  { id: 1, titleKey: 'stepOverview' },
  { id: 2, titleKey: 'stepMedia' },
  { id: 3, titleKey: 'stepPrograms' },
  { id: 4, titleKey: 'stepCampus' },
  { id: 5, titleKey: 'stepContact' },
]

const step1Schema = z.object({
  name: z.string().min(1),
  slogan: z.string().optional(),
  foundedYear: z.coerce.number().optional(),
  studentCount: z.coerce.number().optional(),
  accreditation: z.string().optional(),
  rating: z.coerce.number().min(0).max(100).optional(),
  description: z.string().optional(),
  minLanguageLevel: z.string().optional(),
  tuitionPrice: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(0).optional()),
})

export function UniversityOnboarding() {
  const { t } = useTranslation(['university', 'common'])
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
  })

  const onStep1 = (data: z.infer<typeof step1Schema>) => {
    if (step < 5) setStep((s) => s + 1)
    else submitFull(data)
  }

  const submitFull = async (data: z.infer<typeof step1Schema>) => {
    setError('')
    setSubmitting(true)
    try {
      await updateProfile({
        name: data.name,
        slogan: data.slogan || undefined,
        foundedYear: data.foundedYear ?? undefined,
        studentCount: data.studentCount ?? undefined,
        description: data.description || undefined,
        minLanguageLevel: data.minLanguageLevel || undefined,
        tuitionPrice: data.tuitionPrice ?? undefined,
      })
      navigate('/university/dashboard')
    } catch (e) {
      setError(getApiError(e).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageTitle title={t('university:onboardingTitle')} icon="GraduationCap" />

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`px-3 py-1.5 rounded-input text-sm font-medium whitespace-nowrap ${
              step === s.id ? 'bg-primary-accent text-primary-dark' : 'bg-[var(--color-border)]'
            }`}
          >
            {s.id}. {t(`university:${s.titleKey}`)}
          </button>
        ))}
      </div>

      <Card>
        <CardTitle>{t(`university:${STEPS[step - 1].titleKey}`)}</CardTitle>

        {step === 1 && (
          <form onSubmit={handleSubmit(onStep1)} className="space-y-4 mt-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Input label={t('university:universityName')} error={errors.name?.message} {...register('name')} />
            <Input label={t('university:slogan')} {...register('slogan')} />
            <Input label={t('university:foundedYear')} type="number" {...register('foundedYear')} />
            <Input label={t('university:studentCount')} type="number" {...register('studentCount')} />
            <Input label={t('university:accreditation')} {...register('accreditation')} />
            <Input label={t('university:rating')} type="number" {...register('rating')} />
            <Textarea
              label={t('university:description')}
              rows={4}
              {...register('description')}
            />
            <Input
              label={t('university:minLanguageLevelLabel')}
              {...register('minLanguageLevel')}
              placeholder={t('university:minLanguageLevelPlaceholder')}
            />
            <Input
              label={t('university:tuitionPriceLabel')}
              type="number"
              {...register('tuitionPrice')}
              placeholder={t('university:tuitionPricePlaceholder')}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} loading={submitting}>{t('common:next')}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/university/dashboard')}>{t('university:skip')}</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-4">
            <Input label={t('university:country')} />
            <Input label={t('university:city')} />
            <p className="text-sm text-[var(--color-text-muted)]">{t('university:onboardingStep2Hint')}</p>
            <div className="flex gap-2">
              <Button onClick={() => setStep(2 + 1)}>{t('common:next')}</Button>
              <Button variant="secondary" onClick={() => setStep(1)}>{t('common:back')}</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-[var(--color-text-muted)]">{t('university:onboardingStep3Hint')}</p>
            <div className="flex gap-2">
              <Button onClick={() => setStep(3 + 1)}>{t('common:next')}</Button>
              <Button variant="secondary" onClick={() => setStep(2)}>{t('common:back')}</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-[var(--color-text-muted)]">{t('university:onboardingStep4Hint')}</p>
            <div className="flex gap-2">
              <Button onClick={() => setStep(4 + 1)}>{t('common:next')}</Button>
              <Button variant="secondary" onClick={() => setStep(3)}>{t('common:back')}</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 mt-4">
            <Input label={t('university:contactEmail')} type="email" />
            <Input label={t('university:phone')} />
            <p className="text-sm text-[var(--color-text-muted)]">{t('university:onboardingStep5Hint')}</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" onClick={() => handleSubmit(submitFull)()} disabled={submitting} loading={submitting}>{t('common:submit')}</Button>
              <Button type="button" variant="secondary" onClick={() => setStep(4)}>{t('common:back')}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
