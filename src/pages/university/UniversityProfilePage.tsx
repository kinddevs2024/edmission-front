import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getProfile, updateProfile } from '@/services/university'
import { getApiError } from '@/services/auth'
import type { UniversityProfile } from '@/types/university'

const schema = z.object({
  name: z.string().min(1, 'Название вуза обязательно'),
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<UniversityProfile | null>(null)

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
        <p className="text-[var(--color-text-muted)]">Загрузка профиля…</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-h1">Профиль университета</h1>
      <p className="text-[var(--color-text-muted)]">Заполните данные о вузе: они видны абитуриентам в карточке и на странице университета.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-input bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardTitle>Основное</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label="Название университета" error={errors.name?.message} {...register('name')} required />
            <Input label="Слоган" {...register('slogan')} placeholder="Краткий девиз или теглайн" />
            <Input label="Год основания" type="number" {...register('foundedYear')} placeholder="Например: 1918" />
            <Input label="Количество студентов" type="number" {...register('studentCount')} placeholder="Ориентировочно" />
            <Input label="Ссылка на логотип" {...register('logo')} placeholder="https://..." />
            <label className="block">
              <span className="block text-sm font-medium mb-1">Описание</span>
              <textarea
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 min-h-[120px]"
                rows={4}
                {...register('description')}
                placeholder="О вузе, миссии, сильных сторонах"
              />
            </label>
          </div>
        </Card>

        <Card>
          <CardTitle>Местоположение</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label="Страна" {...register('country')} />
            <Input label="Город" {...register('city')} />
          </div>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </div>
  )
}
