import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getStudentProfile, updateStudentProfile, type StudentProfileData } from '@/services/student'
import { getApiError } from '@/services/auth'

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthDate: z.string().optional(),
  country: z.string().optional(),
  gradeLevel: z.string().optional(),
  gpa: z.preprocess((v) => (v === '' ? undefined : v), z.number().min(0).max(4).optional()),
  languageLevel: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export function StudentProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<StudentProfileData | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    getStudentProfile()
      .then((data) => {
        setProfile(data)
        reset({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          birthDate: data.birthDate ? (typeof data.birthDate === 'string' ? data.birthDate.slice(0, 10) : new Date(data.birthDate).toISOString().slice(0, 10)) : '',
          country: data.country ?? '',
          gradeLevel: data.gradeLevel ?? '',
          gpa: data.gpa ?? undefined,
          languageLevel: data.languageLevel ?? '',
          bio: data.bio ?? '',
          avatarUrl: data.avatarUrl ?? '',
        })
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (data: FormData) => {
    setError('')
    setSaving(true)
    try {
      const updated = await updateStudentProfile({
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        birthDate: data.birthDate || undefined,
        country: data.country || undefined,
        gradeLevel: data.gradeLevel || undefined,
        gpa: Number.isFinite(data.gpa) ? data.gpa : undefined,
        languageLevel: data.languageLevel || undefined,
        bio: data.bio || undefined,
        avatarUrl: data.avatarUrl || undefined,
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
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Профиль студента</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        Заполните данные о себе — это поможет вузам и системе подбора рекомендовать подходящие программы и стипендии.
      </p>

      {profile?.portfolioCompletionPercent != null && (
        <Card className="p-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Заполненность профиля: <strong className="text-[var(--color-text)]">{profile.portfolioCompletionPercent}%</strong>
          </p>
        </Card>
      )}

      <Card className="p-6">
        <CardTitle className="mb-4">Личные данные</CardTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Имя" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Фамилия" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label="Дата рождения" type="date" error={errors.birthDate?.message} {...register('birthDate')} />
          <Input label="Страна" error={errors.country?.message} {...register('country')} />
          <Input label="Класс / уровень образования" error={errors.gradeLevel?.message} {...register('gradeLevel')} placeholder="например 11, 1 курс" />
          <Input label="GPA (0–4)" type="number" step="0.01" min="0" max="4" error={errors.gpa?.message} {...register('gpa')} />
          <Input label="Уровень языка" error={errors.languageLevel?.message} {...register('languageLevel')} placeholder="например B2, IELTS 6.5" />
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">О себе</label>
            <textarea
              className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-text)] min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-accent)]"
              placeholder="Кратко о себе, целях, интересах"
              {...register('bio')}
            />
          </div>
          <Input label="Ссылка на аватар (URL)" error={errors.avatarUrl?.message} {...register('avatarUrl')} placeholder="https://..." />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</Button>
        </form>
      </Card>
    </div>
  )
}
