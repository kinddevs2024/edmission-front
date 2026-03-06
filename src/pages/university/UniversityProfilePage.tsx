import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { useTranslation } from 'react-i18next'
import { getProfile, updateProfile } from '@/services/university'
import { getApiError } from '@/services/auth'
import type { UniversityProfile } from '@/types/university'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'

const schema = z.object({
  name: z.string().min(1),
  slogan: z.string().optional(),
  foundedYear: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(1000).max(2100).optional()),
  studentCount: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(0).optional()),
  country: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal('')),
  facultyCodes: z.array(z.string()).optional(),
  facultyItems: z.record(z.string(), z.array(z.string())).optional(),
  targetStudentCountries: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof schema>

const COUNTRY_CODE_OPTIONS = [
  { code: 'UZ', label: 'Uzbekistan' },
  { code: 'KZ', label: 'Kazakhstan' },
  { code: 'TJ', label: 'Tajikistan' },
  { code: 'KG', label: 'Kyrgyzstan' },
  { code: 'TM', label: 'Turkmenistan' },
  { code: 'TR', label: 'Turkey' },
  { code: 'AE', label: 'UAE' },
  { code: 'CN', label: 'China' },
] as const

export function UniversityProfilePage() {
  const { t } = useTranslation(['university', 'common'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [, setProfile] = useState<UniversityProfile | null>(null)
  const [openFacultyId, setOpenFacultyId] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
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
          facultyCodes: data.facultyCodes ?? [],
          facultyItems: data.facultyItems ?? {},
          targetStudentCountries: data.targetStudentCountries ?? [],
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
        facultyCodes: data.facultyCodes ?? [],
        facultyItems: data.facultyItems ?? undefined,
        targetStudentCountries: data.targetStudentCountries ?? [],
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

        <Card>
          <CardTitle>{t('university:facultiesListTitle')}</CardTitle>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('university:facultiesHint', 'Select faculties that exist in your university. Open a faculty to see what it includes.')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELD_OF_STUDY.map((cat) => {
                const selected = (watch('facultyCodes') ?? []).includes(cat.id)
                const open = openFacultyId === cat.id
                return (
                  <div
                    key={cat.id}
                    className={`rounded-card border-2 bg-[var(--color-card)] shadow-[var(--shadow-card)] transition-all ${
                      selected ? 'border-primary-accent ring-1 ring-primary-accent/20' : 'border-[var(--color-border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 p-3">
                      <label className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
                        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-[var(--color-border)] bg-[var(--color-bg)]">
                          {selected && (
                            <span className="h-2.5 w-2.5 rounded-sm bg-primary-accent" />
                          )}
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              const current = watch('facultyCodes') ?? []
                              const next = e.target.checked
                                ? Array.from(new Set([...current, cat.id])).slice(0, 50)
                                : current.filter((x) => x !== cat.id)
                              setValue('facultyCodes', next, { shouldDirty: true })
                            }}
                            className="sr-only"
                          />
                        </span>
                        <span className="text-sm font-medium text-[var(--color-text)] truncate">{t(cat.titleKey)}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setOpenFacultyId(open ? null : cat.id)}
                        className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition-colors"
                        aria-expanded={open}
                      >
                        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {open && (
                      <div className="border-t border-[var(--color-border)] px-3 py-2.5">
                        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{t('university:customizeItemsHint', 'Customize: check only the programs you offer. Uncheck to hide.')}</p>
                        <ul className="text-sm space-y-1.5">
                          {cat.items.map((it) => {
                            const facultyItems = watch('facultyItems') ?? {}
                            const included = facultyItems[cat.id] ?? cat.items
                            const checked = included.includes(it)
                            return (
                              <li key={it} className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const current = watch('facultyItems') ?? {}
                                      const list = current[cat.id] ?? cat.items
                                      const next = checked ? list.filter((x) => x !== it) : [...list, it]
                                      setValue('facultyItems', { ...current, [cat.id]: next }, { shouldDirty: true })
                                    }}
                                    className="rounded border-[var(--color-border)]"
                                  />
                                  <span className={checked ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>{it}</span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>{t('university:targetStudentCountries', 'Preferred student countries')}</CardTitle>
          <div className="mt-4 space-y-4">
            <ChipSelect
              options={COUNTRY_CODE_OPTIONS.map((c) => c.label)}
              value={(watch('targetStudentCountries') ?? []).map(
                (code) => COUNTRY_CODE_OPTIONS.find((c) => c.code === code)?.label ?? code
              )}
              onChange={(labels) => {
                const codes = labels
                  .map((label) => COUNTRY_CODE_OPTIONS.find((c) => c.label === label)?.code)
                  .filter((v) => !!v)
                  .map((v) => String(v))
                setValue('targetStudentCountries', codes, { shouldDirty: true })
              }}
              max={10}
              placeholder={t('university:targetStudentCountriesPlaceholder', 'Select countries')}
            />
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
