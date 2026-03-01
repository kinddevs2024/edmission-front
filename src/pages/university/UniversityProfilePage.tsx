import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTranslation } from 'react-i18next'
import { getProfile, updateProfile } from '@/services/university'
import { getApiError } from '@/services/auth'
import type { UniversityProfile } from '@/types/university'

const schema = z.object({
  name: z.string().min(1),
  slogan: z.string().optional(),
  foundedYear: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(1000).max(2100).optional()),
  studentCount: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(0).optional()),
  country: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export function UniversityProfilePage() {
  const { t } = useTranslation(['university', 'common'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [, setProfile] = useState<UniversityProfile | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data)
        reset({
          name: data.name ?? '',
          slogan: data.slogan ?? '',
          foundedYear: data.foundedYear ?? undefined,
          studentCount: data.studentCount ?? undefined,
          country: data.country ?? '',
          city: data.city ?? '',
          description: data.description ?? '',
          logo: data.logo ?? '',
        })
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (data: FormData) => {
    setError('')
    setSaving(true)
    try {
      const updated = await updateProfile({
        name: data.name,
        slogan: data.slogan || undefined,
        foundedYear: data.foundedYear ?? undefined,
        studentCount: data.studentCount ?? undefined,
        country: data.country || undefined,
        city: data.city || undefined,
        description: data.description || undefined,
        logo: data.logo || undefined,
      })
      setProfile(updated)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-[var(--color-text-muted)]">{t('university:loadingProfile')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <PageTitle title={t('university:profileTitle')} icon="User" />
      <p className="text-[var(--color-text-muted)]">{t('university:profileIntro')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-input bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardTitle>{t('university:sectionBasic')}</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label={t('university:universityName')} error={errors.name?.message} {...register('name')} required />
            <Input label={t('university:slogan')} {...register('slogan')} placeholder={t('university:sloganPlaceholder')} />
            <Input label={t('university:foundedYear')} type="number" {...register('foundedYear')} placeholder={t('university:foundedPlaceholder')} />
            <Input label={t('university:studentCount')} type="number" {...register('studentCount')} placeholder={t('university:studentCountPlaceholder')} />
            <Input label={t('university:logoUrl')} {...register('logo')} placeholder="https://..." />
            <label className="block">
              <span className="block text-sm font-medium mb-1">{t('university:description')}</span>
              <textarea
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 min-h-[120px]"
                rows={4}
                {...register('description')}
                placeholder={t('university:descriptionPlaceholder')}
              />
            </label>
          </div>
        </Card>

        <Card>
          <CardTitle>{t('university:sectionLocation')}</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label={t('university:country')} {...register('country')} />
            <Input label={t('university:city')} {...register('city')} />
          </div>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving} loading={saving}>
            {t('common:save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
