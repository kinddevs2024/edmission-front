import { useEffect, useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FileUpload } from '@/components/ui/FileUpload'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { useTranslation } from 'react-i18next'
import { getProfile, updateProfile } from '@/services/university'
import { getUniversityProfileByUser, updateUniversityProfileByUser } from '@/services/admin'
import { getApiError, getProfile as refreshAuthUser } from '@/services/auth'
import { notifySuccess } from '@/utils/notify'
import { getImageUrl } from '@/services/upload'
import type { UniversityProfile } from '@/types/university'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { useAuth } from '@/hooks/useAuth'
import { AdminUniversityOfferModal } from '@/components/admin/AdminUniversityOfferModal'
import { mergeCountryOptionLabels, normalizeCountryLabel } from '@/utils/countryLabels'
import { getWorldCountryLabelsSorted } from '@/utils/worldCountries'

const uploadedLogoSchema = z.string().trim().refine(
  (value) => value === '' || /^https?:\/\//.test(value) || value.startsWith('/'),
  { message: 'Enter a valid URL or upload a file' }
)

const schema = z.object({
  name: z.string().min(1),
  slogan: z.string().optional(),
  foundedYear: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(1000).max(2100).optional()),
  studentCount: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(0).optional()),
  rating: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(0).optional()),
  country: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  logo: uploadedLogoSchema,
  coverImage: uploadedLogoSchema.optional(),
  facultyCodes: z.array(z.string()).optional(),
  facultyItems: z.record(z.string(), z.array(z.string())).optional(),
  targetStudentCountries: z.array(z.string()).optional(),
  minLanguageLevel: z.string().optional(),
  ieltsMinBand: z.preprocess((v) => (v === '' || v === undefined ? undefined : v), z.coerce.number().min(0).max(9).optional()),
  gpaMinMode: z.union([z.literal(''), z.literal('scale'), z.literal('percent')]).optional(),
  gpaMinValue: z.preprocess((v) => (v === '' || v === undefined ? undefined : v), z.coerce.number().min(0).optional()),
  tuitionPrice: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().min(0).optional()),
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

type UniversityProfilePageProps = {
  /** Admin: edit this university account’s profile (same form as /university/profile). */
  adminEditUserId?: string
}

export function UniversityProfilePage({ adminEditUserId }: UniversityProfilePageProps = {}) {
  const { t } = useTranslation(['university', 'common', 'admin'])
  const { role } = useAuth()
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [, setProfile] = useState<UniversityProfile | null>(null)
  const [openFacultyId, setOpenFacultyId] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      logo: '',
      coverImage: '',
      gpaMinMode: '' as '' | 'scale' | 'percent',
    },
  })
  const logoValue = watch('logo') ?? ''
  const nameValue = watch('name') ?? ''
  const countryWatch = watch('country')
  const universityCountrySelectOptions = useMemo(() => {
    const world = getWorldCountryLabelsSorted()
    const cur = normalizeCountryLabel(countryWatch)
    return mergeCountryOptionLabels(world, cur ? [cur] : []).map((v) => ({ value: v, label: v }))
  }, [countryWatch])
  const [logoPreviewError, setLogoPreviewError] = useState(false)
  useEffect(() => setLogoPreviewError(false), [logoValue])

  useEffect(() => {
    const load = adminEditUserId
      ? getUniversityProfileByUser(adminEditUserId).then((p) => {
          reset({
            name: p.universityName ?? '',
            slogan: p.tagline ?? '',
            foundedYear: p.establishedYear ?? undefined,
            studentCount: p.studentCount ?? undefined,
            rating: p.rating ?? undefined,
            country: p.country ?? '',
            city: p.city ?? '',
            description: p.description ?? '',
            logo: p.logoUrl ?? '',
            coverImage: p.coverImageUrl ?? '',
            facultyCodes: p.facultyCodes ?? [],
            facultyItems: p.facultyItems ?? {},
            targetStudentCountries: p.targetStudentCountries ?? [],
            minLanguageLevel: p.minLanguageLevel ?? '',
            ieltsMinBand: p.ieltsMinBand ?? undefined,
            gpaMinMode: (p.gpaMinMode === 'scale' || p.gpaMinMode === 'percent' ? p.gpaMinMode : '') as '' | 'scale' | 'percent',
            gpaMinValue: p.gpaMinValue ?? undefined,
            tuitionPrice: p.tuitionPrice ?? undefined,
          })
          setProfile(null)
        })
      : getProfile()
          .then((data) => {
            setProfile(data)
            reset({
              name: data.name ?? '',
              slogan: data.slogan ?? '',
              foundedYear: data.foundedYear ?? undefined,
              studentCount: data.studentCount ?? undefined,
              rating: data.rating ?? undefined,
              country: data.country ?? '',
              city: data.city ?? '',
              description: data.description ?? '',
              logo: data.logo ?? '',
              coverImage: (data as { coverImage?: string; coverImageUrl?: string }).coverImage
                ?? (data as { coverImageUrl?: string }).coverImageUrl
                ?? '',
              facultyCodes: data.facultyCodes ?? [],
              facultyItems: data.facultyItems ?? {},
              targetStudentCountries: data.targetStudentCountries ?? [],
              minLanguageLevel: data.minLanguageLevel ?? '',
              ieltsMinBand: (data as { ieltsMinBand?: number }).ieltsMinBand ?? undefined,
              gpaMinMode: ((data as { gpaMinMode?: string }).gpaMinMode as 'scale' | 'percent' | '') ?? '',
              gpaMinValue: (data as { gpaMinValue?: number }).gpaMinValue ?? undefined,
              tuitionPrice: data.tuitionPrice ?? undefined,
            })
          })
    load.catch((e) => setError(getApiError(e).message)).finally(() => setLoading(false))
  }, [adminEditUserId, reset])

  const onSubmit = async (data: FormData) => {
    setError('')
    setSaving(true)
    try {
      if (adminEditUserId) {
        await updateUniversityProfileByUser(adminEditUserId, {
          universityName: data.name.trim(),
          tagline: data.slogan?.trim() || undefined,
          establishedYear: data.foundedYear ?? undefined,
          studentCount: data.studentCount ?? undefined,
          rating: data.rating ?? undefined,
          country: normalizeCountryLabel(data.country) || undefined,
          city: data.city?.trim() || undefined,
          description: data.description?.trim() || undefined,
          logoUrl: data.logo?.trim() || undefined,
          coverImageUrl: data.coverImage?.trim() || undefined,
          facultyCodes: data.facultyCodes ?? [],
          facultyItems: Object.keys(data.facultyItems ?? {}).length ? data.facultyItems : undefined,
          targetStudentCountries: data.targetStudentCountries ?? [],
          minLanguageLevel: data.minLanguageLevel?.trim() || undefined,
          ieltsMinBand: data.ieltsMinBand != null && Number.isFinite(data.ieltsMinBand) ? data.ieltsMinBand : null,
          gpaMinMode:
            data.gpaMinMode === 'scale' || data.gpaMinMode === 'percent' ? data.gpaMinMode : null,
          gpaMinValue:
            data.gpaMinMode === 'scale' || data.gpaMinMode === 'percent'
              ? data.gpaMinValue != null && Number.isFinite(data.gpaMinValue)
                ? data.gpaMinValue
                : null
              : null,
          tuitionPrice: data.tuitionPrice ?? undefined,
        })
        const p = await getUniversityProfileByUser(adminEditUserId)
        reset({
          name: p.universityName ?? '',
          slogan: p.tagline ?? '',
          foundedYear: p.establishedYear ?? undefined,
          studentCount: p.studentCount ?? undefined,
          rating: p.rating ?? undefined,
          country: p.country ?? '',
          city: p.city ?? '',
          description: p.description ?? '',
          logo: p.logoUrl ?? '',
          coverImage: p.coverImageUrl ?? '',
          facultyCodes: p.facultyCodes ?? [],
          facultyItems: p.facultyItems ?? {},
          targetStudentCountries: p.targetStudentCountries ?? [],
          minLanguageLevel: p.minLanguageLevel ?? '',
          ieltsMinBand: p.ieltsMinBand ?? undefined,
          gpaMinMode: (p.gpaMinMode === 'scale' || p.gpaMinMode === 'percent' ? p.gpaMinMode : '') as '' | 'scale' | 'percent',
          gpaMinValue: p.gpaMinValue ?? undefined,
          tuitionPrice: p.tuitionPrice ?? undefined,
        })
        notifySuccess(t('common:saved', 'Saved'))
      } else {
        const updated = await updateProfile({
          name: data.name,
          slogan: data.slogan || undefined,
          foundedYear: data.foundedYear ?? undefined,
          studentCount: data.studentCount ?? undefined,
          rating: data.rating ?? undefined,
          country: normalizeCountryLabel(data.country) || undefined,
          city: data.city || undefined,
          description: data.description || undefined,
          logo: data.logo || undefined,
          coverImage: data.coverImage || undefined,
          facultyCodes: data.facultyCodes ?? [],
          facultyItems: data.facultyItems ?? undefined,
          targetStudentCountries: data.targetStudentCountries ?? [],
          minLanguageLevel: data.minLanguageLevel || undefined,
          ieltsMinBand: data.ieltsMinBand != null && Number.isFinite(data.ieltsMinBand) ? data.ieltsMinBand : undefined,
          gpaMinMode:
            data.gpaMinMode === 'scale' || data.gpaMinMode === 'percent' ? data.gpaMinMode : undefined,
          gpaMinValue:
            data.gpaMinMode === 'scale' || data.gpaMinMode === 'percent'
              ? data.gpaMinValue != null && Number.isFinite(data.gpaMinValue)
                ? data.gpaMinValue
                : undefined
              : undefined,
          tuitionPrice: data.tuitionPrice ?? undefined,
        })
        setProfile(updated)
        await refreshAuthUser().catch(() => {})
      }
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-8 w-64 rounded-card bg-[var(--color-border)] animate-pulse" />
        <Card><div className="h-52 rounded-card bg-[var(--color-border)] animate-pulse" /></Card>
        <Card><div className="h-40 rounded-card bg-[var(--color-border)] animate-pulse" /></Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-page-bottom-cta">
      <div data-onboarding="university-profile-overview">
        <PageTitle title={t('university:profileTitle')} icon="User" />
      </div>
      {adminEditUserId && role === 'admin' ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" to={`/admin/users/${adminEditUserId}/university-documents`}>
            {t('admin:universityDocumentsAndTemplates', 'Documents & templates')}
          </Button>
          <Button type="button" onClick={() => setOfferModalOpen(true)}>
            {t('admin:sendOfferAsUniversity', 'Send offer as this university')}
          </Button>
          <AdminUniversityOfferModal
            open={offerModalOpen}
            onClose={() => setOfferModalOpen(false)}
            universityUserId={adminEditUserId}
          />
        </div>
      ) : null}
      <p className="text-[var(--color-text-muted)]">{t('university:profileIntro')}</p>

      <div className="flex flex-wrap items-center gap-4" data-onboarding="university-profile-logo-preview">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-center overflow-hidden shrink-0">
          {logoValue.trim() && !logoPreviewError ? (
            <img
              src={getImageUrl(logoValue)}
              alt=""
              className="w-full h-full object-contain p-1.5"
              onError={() => setLogoPreviewError(true)}
            />
          ) : (
            <Building2 className="w-8 h-8 sm:w-9 sm:h-9 text-[var(--color-text-muted)]" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] truncate">
            {nameValue || t('university:profileTitle')}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-input bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>{t('university:sectionBasic')}</CardTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label={t('university:universityName')} error={errors.name?.message} {...register('name')} required />
              </div>
              <div className="sm:col-span-2">
                <Input label={t('university:slogan')} {...register('slogan')} placeholder={t('university:sloganPlaceholder')} />
              </div>
              <Input label={t('university:foundedYear')} type="number" {...register('foundedYear')} placeholder={t('university:foundedPlaceholder')} />
              <Input label={t('university:studentCount')} type="number" {...register('studentCount')} placeholder={t('university:studentCountPlaceholder')} />
              <div className="sm:col-span-2">
                <Textarea
                  label={t('university:description')}
                  rows={3}
                  placeholder={t('university:descriptionPlaceholder')}
                  {...register('description')}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>{t('university:sectionLocation')}</CardTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Select
                label={t('university:country')}
                options={universityCountrySelectOptions}
                placeholder={t('university:countryPlaceholder', 'Select country')}
                {...register('country')}
              />
              <Input label={t('university:city')} {...register('city')} />
              <Input
                label={t('university:rating', 'Rating')}
                type="number"
                min={0}
                step="0.1"
                {...register('rating')}
                placeholder={t('university:ratingPlaceholder', 'Enter rating')}
              />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardTitle>{t('university:sectionRequirements', 'Requirements & Tuition')}</CardTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label={t('university:minRequirements', 'Minimum requirements')} {...register('minLanguageLevel')} placeholder="e.g. IELTS 6.5, TOEFL 90, programming skills, GPA 3.0" />
              </div>
              <Input
                label={t('university:ieltsMinBand', 'Minimum IELTS band (optional)')}
                type="number"
                step="0.5"
                min={0}
                max={9}
                {...register('ieltsMinBand')}
                placeholder="e.g. 6.5"
              />
              <Select
                label={t('university:gpaMinMode', 'GPA requirement (optional)')}
                {...register('gpaMinMode')}
                options={[
                  { value: '', label: t('university:gpaMinModeNone', '— None —') },
                  { value: 'scale', label: t('university:gpaMinModeScale', '4.0 scale (e.g. 3.0)') },
                  { value: 'percent', label: t('university:gpaMinModePercent', 'Percentage (e.g. 85)') },
                ]}
              />
              <Input
                label={t('university:gpaMinValue', 'Minimum GPA value')}
                type="number"
                step="0.01"
                {...register('gpaMinValue')}
                placeholder={watch('gpaMinMode') === 'percent' ? '0–100' : '0–4'}
              />
              <Input label={t('university:tuitionPrice', 'Tuition price')} type="number" {...register('tuitionPrice')} placeholder="Annual cost in main currency" />
              <p className="sm:col-span-2 text-xs text-[var(--color-text-muted)]">
                {t('university:ieltsMinBandHint', 'When set, students must upload an IELTS certificate in Documents before they can show interest.')}
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle>{t('university:logo', 'Logo')}</CardTitle>
          <div className="mt-3 grid gap-3">
            <FileUpload
              label={t('university:logo', 'Logo')}
              value={logoValue}
              onChange={(url) => {
                if ((watch('logo') ?? '') === url) return
                setValue('logo', url, { shouldDirty: true, shouldValidate: true })
              }}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              hint={t('university:uploadLogoOrUrl', 'Upload from device or paste a direct logo URL below')}
            />
            <Input
              label={t('university:logoUrl')}
              error={errors.logo?.message}
              {...register('logo')}
              placeholder="https://... or /api/uploads/..."
            />
            <FileUpload
              label={t('university:coverImage', 'Cover image')}
              value={watch('coverImage') ?? ''}
              onChange={(url) => {
                if ((watch('coverImage') ?? '') === url) return
                setValue('coverImage', url, { shouldDirty: true, shouldValidate: true })
              }}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              hint={t('university:coverImageHint', 'Optional large image shown on university detail page')}
            />
            <Input
              label={t('university:coverImageUrl', 'Cover image URL')}
              {...register('coverImage')}
              placeholder="https://... or /api/uploads/..."
            />
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
                      <Checkbox
                        checked={selected}
                        onChange={(e) => {
                          const current = watch('facultyCodes') ?? []
                          const next = e.target.checked
                            ? Array.from(new Set([...current, cat.id])).slice(0, 50)
                            : current.filter((x) => x !== cat.id)
                          setValue('facultyCodes', next, { shouldDirty: true })
                        }}
                        label={<span className="text-sm font-medium text-[var(--color-text)] truncate">{t(cat.titleKey)}</span>}
                        className="flex-1 min-w-0"
                      />
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
                                <Checkbox
                                  checked={checked}
                                  onChange={() => {
                                    const current = watch('facultyItems') ?? {}
                                    const list = current[cat.id] ?? cat.items
                                    const next = checked ? list.filter((x) => x !== it) : [...list, it]
                                    setValue('facultyItems', { ...current, [cat.id]: next }, { shouldDirty: true })
                                  }}
                                  label={<span className={checked ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>{it}</span>}
                                  className="flex-1"
                                />
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
          <Button type="submit" disabled={saving || !isDirty} loading={saving}>
            {t('common:save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
