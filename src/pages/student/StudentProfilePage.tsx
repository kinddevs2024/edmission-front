import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload } from '@/components/ui/FileUpload'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getStudentProfile, updateStudentProfile, type StudentProfileData, type StudentExperience, type StudentPortfolioWork } from '@/services/student'
import { getProfileCriteria } from '@/services/options'
import { getApiError } from '@/services/auth'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthDate: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  gradeLevel: z.string().optional(),
  gpa: z.preprocess((v) => {
    if (v === '' || v === undefined) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }, z.number().min(0).max(4).optional()),
  languageLevel: z.string().optional(),
  languages: z.array(z.object({ language: z.string(), level: z.string() })).optional(),
  educationStatus: z.enum(['in_school', 'finished_school', 'in_university', 'finished_university']).optional(),
  schoolCompleted: z.boolean().optional(),
  schoolName: z.string().optional(),
  graduationYear: z.preprocess((v) => (v === '' ? undefined : v), z.number().min(1950).max(2030).optional()),
  gradingScheme: z.string().optional(),
  gradeScale: z.preprocess((v) => (v === '' ? undefined : v), z.number().optional()),
  highestEducationLevel: z.string().optional(),
  targetDegreeLevel: z.enum(['bachelor', 'master', 'phd']).optional(),
  schoolsAttended: z.array(z.object({
    country: z.string().optional(),
    institutionName: z.string().optional(),
    institutionType: z.enum(['school', 'university']).optional(),
    educationLevel: z.string().optional(),
    gradingScheme: z.string().optional(),
    gradeScale: z.preprocess((v) => (v === '' ? undefined : v), z.number().optional()),
    gradeAverage: z.preprocess((v) => (v === '' ? undefined : v), z.number().optional()),
    primaryLanguage: z.string().optional(),
    attendedFrom: z.string().optional(),
    attendedTo: z.string().optional(),
    degreeName: z.string().optional(),
  })).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  hobbies: z.array(z.string()).optional(),
  experiences: z.array(z.object({
    type: z.enum(['volunteer', 'internship', 'work']),
    title: z.string().optional(),
    organization: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  portfolioWorks: z.array(z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    fileUrl: z.string().optional(),
    linkUrl: z.string().optional(),
  })).optional(),
})

type FormData = z.infer<typeof schema>

const STEP_KEYS = ['stepPersonal', 'stepLocation', 'stepEducation', 'stepAbout', 'stepSkills', 'stepExperience', 'stepWorks'] as const

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Russian', label: 'Русский' },
  { value: 'Uzbek', label: 'Oʻzbek' },
  { value: 'Kazakh', label: 'Қазақша' },
  { value: 'Turkish', label: 'Türkçe' },
  { value: 'Chinese', label: '中文' },
  { value: 'Spanish', label: 'Español' },
  { value: 'French', label: 'Français' },
  { value: 'German', label: 'Deutsch' },
  { value: 'Arabic', label: 'العربية' },
  { value: 'Other', label: 'Другое' },
]
const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']
const TARGET_DEGREE_OPTIONS = [
  { value: 'bachelor', labelKey: 'degreeBachelor' as const },
  { value: 'master', labelKey: 'degreeMaster' as const },
  { value: 'phd', labelKey: 'degreePhd' as const },
]
const GRADING_SCHEME_OPTIONS = [
  { value: 'Other', labelKey: 'gradingOther' as const },
  { value: 'GCE Advanced Level Education', labelKey: 'gradingGCE' as const },
  { value: 'IB', labelKey: 'gradingIB' as const },
  { value: 'National', labelKey: 'gradingNational' as const },
]
const GRADE_SCALE_OPTIONS = [4, 5, 7, 10, 20, 100]
const HIGHEST_EDUCATION_OPTIONS = [
  { value: 'Secondary', labelKey: 'highestSecondary' as const },
  { value: 'Grade 12 / High School', labelKey: 'highestGrade12' as const },
  { value: 'Bachelor', labelKey: 'highestBachelor' as const },
  { value: 'Master', labelKey: 'highestMaster' as const },
  { value: 'PhD', labelKey: 'highestPhd' as const },
]
const EDUCATION_STATUS_OPTIONS = [
  { value: 'in_school' as const, labelKey: 'statusInSchool' as const },
  { value: 'finished_school' as const, labelKey: 'statusFinishedSchool' as const },
  { value: 'in_university' as const, labelKey: 'statusInUniversity' as const },
  { value: 'finished_university' as const, labelKey: 'statusFinishedUniversity' as const },
]

export function StudentProfilePage() {
  const { t } = useTranslation(['student', 'common'])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [step, setStep] = useState(1)
  const [criteria, setCriteria] = useState<{ skills: string[]; interests: string[]; hobbies: string[] } | null>(null)
  const [newLanguage, setNewLanguage] = useState(LANGUAGE_OPTIONS[0].value)
  const [newLevel, setNewLevel] = useState(LEVEL_OPTIONS[0])
  const [customLanguageName, setCustomLanguageName] = useState('')

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      skills: [],
      interests: [],
      hobbies: [],
      languages: [],
      experiences: [],
      portfolioWorks: [],
      schoolsAttended: [],
      educationStatus: undefined,
    },
  })

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: 'experiences' })
  const { fields: schoolsAttendedFields, append: appendSchool, remove: removeSchool } = useFieldArray({ control, name: 'schoolsAttended' })
  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({ control, name: 'portfolioWorks' })
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({ control, name: 'languages' })

  const avatarUrl = watch('avatarUrl')
  const educationStatus = watch('educationStatus')

  const STEPS = STEP_KEYS.map((key, i) => ({
    id: i + 1,
    title: t(key),
  }))

  useEffect(() => {
    getProfileCriteria().then(setCriteria).catch(() => setCriteria({ skills: [], interests: [], hobbies: [] }))
  }, [])

  useEffect(() => {
    getStudentProfile()
      .then((data) => {
        setProfile(data)
        reset({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          birthDate: data.birthDate ? (typeof data.birthDate === 'string' ? data.birthDate.slice(0, 10) : new Date(data.birthDate).toISOString().slice(0, 10)) : '',
          country: data.country ?? '',
          city: data.city ?? '',
          gradeLevel: data.gradeLevel ?? '',
          gpa: data.gpa ?? undefined,
          languageLevel: data.languageLevel ?? '',
          languages: (data.languages && data.languages.length > 0) ? data.languages : (data.languageLevel ? [{ language: 'English', level: data.languageLevel }] : []),
          educationStatus: data.educationStatus ?? undefined,
          schoolCompleted: data.schoolCompleted ?? false,
          schoolName: data.schoolName ?? '',
          graduationYear: data.graduationYear ?? undefined,
          gradingScheme: data.gradingScheme ?? '',
          gradeScale: data.gradeScale ?? undefined,
          highestEducationLevel: data.highestEducationLevel ?? '',
          targetDegreeLevel: data.targetDegreeLevel ?? undefined,
          schoolsAttended: (data.schoolsAttended ?? []).map((s) => ({
            country: s.country ?? '',
            institutionName: s.institutionName ?? '',
            institutionType: s.institutionType ?? undefined,
            educationLevel: s.educationLevel ?? '',
            gradingScheme: s.gradingScheme ?? '',
            gradeScale: s.gradeScale,
            gradeAverage: s.gradeAverage,
            primaryLanguage: s.primaryLanguage ?? '',
            attendedFrom: s.attendedFrom ? (typeof s.attendedFrom === 'string' ? s.attendedFrom.slice(0, 10) : new Date(s.attendedFrom).toISOString().slice(0, 10)) : '',
            attendedTo: s.attendedTo ? (typeof s.attendedTo === 'string' ? s.attendedTo.slice(0, 10) : new Date(s.attendedTo).toISOString().slice(0, 10)) : '',
            degreeName: s.degreeName ?? '',
          })),
          bio: data.bio ?? '',
          avatarUrl: data.avatarUrl ?? '',
          skills: data.skills ?? [],
          interests: data.interests ?? [],
          hobbies: data.hobbies ?? [],
          experiences: (data.experiences ?? []).map((e: StudentExperience) => ({
            type: e.type,
            title: e.title ?? '',
            organization: e.organization ?? '',
            startDate: e.startDate ? (typeof e.startDate === 'string' ? e.startDate.slice(0, 10) : new Date(e.startDate).toISOString().slice(0, 10)) : '',
            endDate: e.endDate ? (typeof e.endDate === 'string' ? e.endDate.slice(0, 10) : new Date(e.endDate).toISOString().slice(0, 10)) : '',
            description: e.description ?? '',
          })),
          portfolioWorks: (data.portfolioWorks ?? []).map((w: StudentPortfolioWork) => ({
            title: w.title ?? '',
            description: w.description ?? '',
            fileUrl: w.fileUrl ?? '',
            linkUrl: w.linkUrl ?? '',
          })),
        })
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [reset, t])

  const onSubmit = async (data: FormData) => {
    setError('')
    setSaving(true)
    try {
      const payload = {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        birthDate: data.birthDate || undefined,
        country: data.country || undefined,
        city: data.city || undefined,
        gradeLevel: data.gradeLevel || undefined,
        gpa: Number.isFinite(data.gpa) ? data.gpa : undefined,
        languageLevel: data.languageLevel || undefined,
        languages: data.languages ?? [],
        educationStatus: data.educationStatus || undefined,
        schoolCompleted: data.schoolCompleted,
        schoolName: data.schoolName || undefined,
        graduationYear: data.graduationYear != null ? data.graduationYear : undefined,
        gradingScheme: data.gradingScheme || undefined,
        gradeScale: data.gradeScale != null ? data.gradeScale : undefined,
        highestEducationLevel: data.highestEducationLevel || undefined,
        targetDegreeLevel: data.targetDegreeLevel || undefined,
        schoolsAttended: (data.schoolsAttended ?? []).map((s) => ({
          country: s.country || undefined,
          institutionType: s.institutionType || undefined,
          institutionName: s.institutionName || undefined,
          educationLevel: s.educationLevel || undefined,
          gradingScheme: s.gradingScheme || undefined,
          gradeScale: s.gradeScale != null ? s.gradeScale : undefined,
          gradeAverage: s.gradeAverage != null ? s.gradeAverage : undefined,
          primaryLanguage: s.primaryLanguage || undefined,
          attendedFrom: s.attendedFrom || undefined,
          attendedTo: s.attendedTo || undefined,
          degreeName: s.degreeName || undefined,
        })),
        bio: data.bio || undefined,
        avatarUrl: data.avatarUrl || undefined,
        skills: data.skills ?? [],
        interests: data.interests ?? [],
        hobbies: data.hobbies ?? [],
        experiences: (data.experiences ?? []).map((e) => ({
          type: e.type,
          title: e.title || undefined,
          organization: e.organization || undefined,
          startDate: e.startDate || undefined,
          endDate: e.endDate || undefined,
          description: e.description || undefined,
        })),
        portfolioWorks: (data.portfolioWorks ?? []).map((w) => ({
          title: w.title || undefined,
          description: w.description || undefined,
          fileUrl: w.fileUrl || undefined,
          linkUrl: w.linkUrl || undefined,
        })),
      }
      const updated = await updateStudentProfile(payload)
      setProfile(updated)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const currentStepInfo = STEPS[step - 1]
  const isFirstStep = step === 1
  const isLastStep = step === STEPS.length

  const verified = user?.studentProfile?.verifiedAt

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-[var(--color-text-muted)]">{t('loadingProfile')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('portfolioTitle')}</h1>
        {verified && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-600 dark:text-green-400" title={t('common:verified')}>
            <span aria-hidden>✓</span> {t('common:verified')}
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">
        {t('portfolioIntro')}
      </p>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{t('portfolioCompletion')}</p>
            <p className="text-2xl font-semibold text-[var(--color-text)]">
              {profile?.portfolioCompletionPercent ?? 0}%
            </p>
          </div>
          <div className="flex-1 max-w-[200px] h-3 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-primary-accent)] transition-all duration-300"
              style={{ width: `${profile?.portfolioCompletionPercent ?? 0}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={cn(
              'px-3 py-1.5 rounded-input text-sm font-medium whitespace-nowrap transition-colors',
              step === s.id ? 'bg-[var(--color-primary-accent)] text-[var(--color-primary-dark)]' : 'bg-[var(--color-border)] text-[var(--color-text)]'
            )}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <CardTitle className="mb-4">{currentStepInfo.title}</CardTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('firstName')} error={errors.firstName?.message} {...register('firstName')} />
                <Input label={t('lastName')} error={errors.lastName?.message} {...register('lastName')} />
              </div>
              <Input label={t('birthDate')} type="date" error={errors.birthDate?.message} {...register('birthDate')} />
            </>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('country')} error={errors.country?.message} {...register('country')} placeholder={t('country')} />
              <Input label={t('city')} error={errors.city?.message} {...register('city')} placeholder={t('city')} />
            </div>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('educationStatusLabel')}</label>
                <select {...register('educationStatus')} className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm mb-4">
                  <option value="">—</option>
                  {EDUCATION_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('applyingForDegree')}</label>
                <select {...register('targetDegreeLevel')} className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
                  <option value="">—</option>
                  {TARGET_DEGREE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('gradingScheme')}</label>
                <select {...register('gradingScheme')} className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
                  <option value="">—</option>
                  {GRADING_SCHEME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('gradeScaleOutOf')}</label>
                <select {...register('gradeScale')} className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
                  <option value="">—</option>
                  {GRADE_SCALE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('highestLevelOfEducation')}</label>
                <select {...register('highestEducationLevel')} className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
                  <option value="">—</option>
                  {HIGHEST_EDUCATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                  ))}
                </select>
              </div>
              <Input label={t('gradeLevel')} error={errors.gradeLevel?.message} {...register('gradeLevel')} placeholder={t('gradePlaceholder')} />
              <Input label={t('gpa')} type="number" step="0.01" min={0} max={4} error={errors.gpa?.message} {...register('gpa')} />
              <div className="space-y-4">
                <div>
                  <p className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('languageLevel')}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mb-3">{t('languageLevelHint')}</p>
                </div>
                {languageFields.length > 0 && (
                  <ul className="space-y-2" role="list">
                    {languageFields.map((field, i) => (
                      <li
                        key={field.id}
                        className="flex flex-wrap items-center gap-3 py-3 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm"
                      >
                        <span className="font-medium text-[var(--color-text)]">{watch(`languages.${i}.language`)}</span>
                        <span className="text-[var(--color-text-muted)]">·</span>
                        <span className="text-sm text-[var(--color-text-muted)]">{watch(`languages.${i}.level`)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLanguage(i)}
                          className="ml-auto text-[var(--color-text-muted)] hover:text-red-500"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Card className="p-4 border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)]">
                  <p className="text-sm font-medium text-[var(--color-text)] mb-3">{t('addLanguage')}</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="min-w-[140px]">
                      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{t('common:language')}</label>
                      <select
                        value={newLanguage}
                        onChange={(e) => {
                          setNewLanguage(e.target.value)
                          if (e.target.value !== 'Other') setCustomLanguageName('')
                        }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-shadow"
                        aria-label="Language"
                      >
                        {LANGUAGE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {newLanguage === 'Other' && (
                      <div className="min-w-[160px]">
                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Название языка</label>
                        <input
                          type="text"
                          value={customLanguageName}
                          onChange={(e) => setCustomLanguageName(e.target.value)}
                          placeholder="Например: Итальянский"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                        />
                      </div>
                    )}
                    <div className="min-w-[100px]">
                      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Уровень</label>
                      <select
                        value={newLevel}
                        onChange={(e) => setNewLevel(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-shadow"
                        aria-label="Level"
                      >
                        {LEVEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl h-[42px] px-4"
                      onClick={() => {
                        const langToAdd = newLanguage === 'Other' ? customLanguageName.trim() : newLanguage
                        if (!langToAdd) return
                        appendLanguage({ language: langToAdd, level: newLevel })
                        if (newLanguage === 'Other') setCustomLanguageName('')
                      }}
                      icon={<Plus className="w-4 h-4" />}
                      disabled={newLanguage === 'Other' && !customLanguageName.trim()}
                    >
                      Добавить
                    </Button>
                  </div>
                  {newLanguage === 'Other' && !customLanguageName.trim() && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">Введите название языка и нажмите «Добавить».</p>
                  )}
                </Card>
              </div>
              <hr className="border-[var(--color-border)]" />
              {(() => {
                const targetDegree = watch('targetDegreeLevel')
                const isMasterOrPhd = targetDegree === 'master' || targetDegree === 'phd'
                const institutionLabel = isMasterOrPhd ? (t('institutionName') || 'University / Institution name') : t('schoolName')
                const completedLabel = isMasterOrPhd ? (t('institutionCompleted') || 'University / Institution completed') : t('schoolCompleted')
                return (
                  <>
                    <p className="text-sm font-medium text-[var(--color-text)]">{completedLabel}</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('schoolCompleted')} className="rounded border-[var(--color-border)]" />
                      <span className="text-sm">{completedLabel}</span>
                    </label>
                    <Input label={institutionLabel} {...register('schoolName')} placeholder={institutionLabel} />
                    <Input label={t('graduationYear')} type="number" min={1950} max={2030} {...register('graduationYear')} placeholder="2024" />
                  </>
                )
              })()}
              <p className="text-sm font-medium text-[var(--color-text)] mt-4">{t('schoolsUniversitiesAttended')}</p>
              <div className="space-y-3">
                {schoolsAttendedFields.map((field, i) => (
                  <Card key={field.id} className="p-4 space-y-2 border border-[var(--color-border)]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('entryNumber', { n: i + 1 })}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSchool(i)} aria-label="Remove"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('institutionTypeLabel')}</label>
                      <select {...register(`schoolsAttended.${i}.institutionType`)} className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm mb-2">
                        <option value="">—</option>
                        <option value="school">{t('institutionTypeSchool')}</option>
                        <option value="university">{t('institutionTypeUniversity')}</option>
                      </select>
                    </div>
                    <Input label={t('country')} {...register(`schoolsAttended.${i}.country`)} placeholder="e.g. Uzbekistan" />
                    <Input label={t('schoolName')} {...register(`schoolsAttended.${i}.institutionName`)} placeholder={t('schoolName')} />
                    <Input label={t('gradeLevel')} {...register(`schoolsAttended.${i}.educationLevel`)} placeholder={t('gradePlaceholder')} />
                    <Input label={t('primaryLanguageOfInstruction', 'Primary language of instruction')} {...register(`schoolsAttended.${i}.primaryLanguage`)} placeholder="e.g. Uzbek" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label={t('startDate')} type="date" {...register(`schoolsAttended.${i}.attendedFrom`)} />
                      <Input label={t('endDate')} type="date" {...register(`schoolsAttended.${i}.attendedTo`)} />
                    </div>
                    <Input label={`${t('degreeNameOptional', 'Degree name')} (${t('common:optional', 'optional')})`} {...register(`schoolsAttended.${i}.degreeName`)} placeholder="For university" />
                  </Card>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={() => appendSchool({ country: '', institutionName: '', institutionType: (educationStatus === 'in_university' || educationStatus === 'finished_university') ? 'university' : 'school', educationLevel: '', primaryLanguage: '', attendedFrom: '', attendedTo: '', degreeName: '' })} icon={<Plus className="w-4 h-4" />}>
                  {t('addSchoolUniversity', 'Add school / university')}
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('bio')}</label>
                <textarea
                  className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-text)] min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-accent)]"
                  placeholder={t('bioPlaceholder')}
                  {...register('bio')}
                />
              </div>
              <FileUpload
                label={t('avatarUrl')}
                variant="avatar"
                value={avatarUrl}
                onChange={(url) => setValue('avatarUrl', url)}
                hint={t('uploadPhotoOrLink')}
              />
            </>
          )}

          {step === 5 && (
            <>
              {!criteria ? (
                <p className="text-[var(--color-text-muted)]">Loading options…</p>
              ) : (
            <>
              <CardTitle className="mb-2">{t('skillsPlaceholder')}</CardTitle>
              <ChipSelect
                options={criteria.skills}
                value={watch('skills') ?? []}
                onChange={(v) => setValue('skills', v)}
                max={50}
                placeholder={t('skillsPlaceholder')}
                className="mb-6"
              />
              <CardTitle className="mb-2">Interests</CardTitle>
              <ChipSelect
                options={criteria.interests}
                value={watch('interests') ?? []}
                onChange={(v) => setValue('interests', v)}
                max={30}
                placeholder="Select your interests (e.g. IT, books, travel)"
                className="mb-6"
              />
              <CardTitle className="mb-2">Hobbies & activities</CardTitle>
              <ChipSelect
                options={criteria.hobbies}
                value={watch('hobbies') ?? []}
                onChange={(v) => setValue('hobbies', v)}
                max={30}
                placeholder="Select hobbies and activities"
              />
            </>
              )}
            </>
          )}

          {step === 6 && (
            <>
              <div className="space-y-4">
                {experienceFields.map((field, i) => (
                  <Card key={field.id} className="p-4 space-y-3 border border-[var(--color-border)]">
                    <div className="flex justify-between items-center">
                      <select {...register(`experiences.${i}.type`)} className="rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
                        <option value="volunteer">{t('volunteer')}</option>
                        <option value="internship">{t('internship')}</option>
                        <option value="work">{t('work')}</option>
                      </select>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeExperience(i)} aria-label={t('removeExperience')}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input label={t('title')} {...register(`experiences.${i}.title`)} placeholder={t('title')} />
                    <Input label={t('organization')} {...register(`experiences.${i}.organization`)} placeholder={t('organization')} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label={t('startDate')} type="date" {...register(`experiences.${i}.startDate`)} />
                      <Input label={t('endDate')} type="date" {...register(`experiences.${i}.endDate`)} />
                    </div>
                    <textarea
                      className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm min-h-[80px]"
                      placeholder={t('description')}
                      {...register(`experiences.${i}.description`)}
                    />
                  </Card>
                ))}
                <Button type="button" variant="secondary" onClick={() => appendExperience({ type: 'volunteer', title: '', organization: '', startDate: '', endDate: '', description: '' })} icon={<Plus className="w-4 h-4" />}>
                  {t('addExperience')}
                </Button>
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <div className="space-y-4">
                {workFields.map((field, i) => (
                  <Card key={field.id} className="p-4 space-y-3 border border-[var(--color-border)]">
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeWork(i)} aria-label={t('removeWork')}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input label={t('workTitle')} {...register(`portfolioWorks.${i}.title`)} placeholder={t('workTitle')} />
                    <textarea
                      className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm min-h-[60px]"
                      placeholder={t('workDescription')}
                      {...register(`portfolioWorks.${i}.description`)}
                    />
                    <FileUpload
                      label={t('workFileOrLink')}
                      value={watch(`portfolioWorks.${i}.fileUrl`)}
                      onChange={(url) => setValue(`portfolioWorks.${i}.fileUrl`, url)}
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    />
                    <Input label="" {...register(`portfolioWorks.${i}.linkUrl`)} placeholder="https://… (optional link)" />
                  </Card>
                ))}
                <Button type="button" variant="secondary" onClick={() => appendWork({ title: '', description: '', fileUrl: '', linkUrl: '' })} icon={<Plus className="w-4 h-4" />}>
                  {t('addWork')}
                </Button>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            {!isFirstStep && (
              <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
                {t('common:back')}
              </Button>
            )}
            <Button type="submit" disabled={saving} loading={saving}>
              {t('common:save')}
            </Button>
            {!isLastStep && (
              <Button type="button" variant="secondary" onClick={() => setStep((s) => s + 1)}>
                {t('common:next')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
