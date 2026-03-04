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
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, User, MapPin, GraduationCap, FileText, Sparkles, Briefcase, FolderOpen } from 'lucide-react'
import { cn } from '@/utils/cn'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { getStudentAvatarUrl } from '@/services/upload'

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
  educationStatus: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['in_school', 'finished_school', 'in_university', 'finished_university']).optional()),
  schoolCompleted: z.boolean().optional(),
  schoolName: z.string().optional(),
  graduationYear: z.preprocess((v) => (v === '' ? undefined : v), z.number().min(1950).max(2030).optional()),
  gradingScheme: z.string().optional(),
  gradeScale: z.preprocess((v) => (v === '' ? undefined : v), z.number().optional()),
  highestEducationLevel: z.string().optional(),
  targetDegreeLevel: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['bachelor', 'master', 'phd']).optional()),
  schoolsAttended: z.array(z.object({
    country: z.string().optional(),
    institutionName: z.string().optional(),
    institutionType: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['school', 'university']).optional()),
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
  interestedFaculties: z.array(z.string()).optional(),
  preferredCountries: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof schema>

const STEP_KEYS = ['stepPersonal', 'stepLocation', 'stepEducation', 'stepAbout', 'stepSkills', 'stepExperience', 'stepWorks'] as const

type SectionId = 'personal' | 'location' | 'education' | 'about' | 'skills' | 'experience' | 'works'

const SECTIONS: { id: SectionId; titleKey: string; icon: typeof User }[] = [
  { id: 'personal', titleKey: 'stepPersonal', icon: User },
  { id: 'location', titleKey: 'stepLocation', icon: MapPin },
  { id: 'education', titleKey: 'stepEducation', icon: GraduationCap },
  { id: 'about', titleKey: 'stepAbout', icon: FileText },
  { id: 'skills', titleKey: 'stepSkills', icon: Sparkles },
  { id: 'experience', titleKey: 'stepExperience', icon: Briefcase },
  { id: 'works', titleKey: 'stepWorks', icon: FolderOpen },
]

function getSectionPercent(profile: StudentProfileData | null, sectionId: SectionId): number {
  if (!profile) return 0
  switch (sectionId) {
    case 'personal': {
      const n = [profile.firstName, profile.lastName, profile.birthDate].filter((v) => v != null && String(v).trim() !== '').length
      return Math.round((n / 3) * 100)
    }
    case 'location': {
      const hasCountry = profile.country != null && String(profile.country).trim() !== ''
      const hasCity = profile.city != null && String(profile.city).trim() !== ''
      const hasPreferred = Array.isArray(profile.preferredCountries) && profile.preferredCountries.length > 0
      return Math.round(([hasCountry, hasCity, hasPreferred].filter(Boolean).length / 3) * 100)
    }
    case 'education': {
      const checks = [
        profile.educationStatus,
        profile.targetDegreeLevel,
        (profile.gradeLevel != null && String(profile.gradeLevel).trim() !== '') || Number.isFinite(profile.gpa),
        (Array.isArray(profile.languages) && profile.languages.length > 0) || (profile.languageLevel != null && String(profile.languageLevel).trim() !== ''),
        (profile.schoolName != null && String(profile.schoolName).trim() !== '') || (Array.isArray(profile.schoolsAttended) && profile.schoolsAttended.length > 0),
        Array.isArray(profile.interestedFaculties) && profile.interestedFaculties.length > 0,
      ]
      return Math.round((checks.filter(Boolean).length / 6) * 100)
    }
    case 'about': {
      const bio = profile.bio != null && String(profile.bio).trim() !== ''
      const avatar = profile.avatarUrl != null && String(profile.avatarUrl).trim() !== ''
      return Math.round(([bio, avatar].filter(Boolean).length / 2) * 100)
    }
    case 'skills': {
      const n = [
        Array.isArray(profile.skills) && profile.skills.length > 0,
        Array.isArray(profile.interests) && profile.interests.length > 0,
        Array.isArray(profile.hobbies) && profile.hobbies.length > 0,
      ].filter(Boolean).length
      return Math.round((n / 3) * 100)
    }
    case 'experience':
      return Array.isArray(profile.experiences) && profile.experiences.length > 0 ? 100 : 0
    case 'works':
      return Array.isArray(profile.portfolioWorks) && profile.portfolioWorks.length > 0 ? 100 : 0
    default:
      return 0
  }
}

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

export function StudentProfilePage() {
  const { t } = useTranslation(['student', 'common'])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  const [criteria, setCriteria] = useState<{ skills: string[]; interests: string[]; hobbies: string[] } | null>(null)
  const [newLanguage, setNewLanguage] = useState(LANGUAGE_OPTIONS[0].value)
  const [newLevel, setNewLevel] = useState(LEVEL_OPTIONS[0])
  const [customLanguageName, setCustomLanguageName] = useState('')
  const [openFacultyId, setOpenFacultyId] = useState<string | null>(null)

  const { register, handleSubmit, reset, control, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
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
      interestedFaculties: [],
      preferredCountries: [],
    },
  })

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: 'experiences' })
  const { fields: schoolsAttendedFields, append: appendSchool, remove: removeSchool } = useFieldArray({ control, name: 'schoolsAttended' })
  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({ control, name: 'portfolioWorks' })
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({ control, name: 'languages' })

  const avatarUrl = watch('avatarUrl')
  const educationStatus = watch('educationStatus')

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
          experiences: (data.experiences ?? []).map((e: StudentExperience) => {
            const type = (e.type === 'internship' || e.type === 'work' ? e.type : 'volunteer') as 'volunteer' | 'internship' | 'work'
            return {
              type,
              title: e.title ?? '',
              organization: e.organization ?? '',
              startDate: e.startDate ? (typeof e.startDate === 'string' ? e.startDate.slice(0, 10) : new Date(e.startDate).toISOString().slice(0, 10)) : '',
              endDate: e.endDate ? (typeof e.endDate === 'string' ? e.endDate.slice(0, 10) : new Date(e.endDate).toISOString().slice(0, 10)) : '',
              description: e.description ?? '',
            }
          }),
          portfolioWorks: (data.portfolioWorks ?? []).map((w: StudentPortfolioWork) => ({
            title: w.title ?? '',
            description: w.description ?? '',
            fileUrl: w.fileUrl ?? '',
            linkUrl: w.linkUrl ?? '',
          })),
          interestedFaculties: data.interestedFaculties ?? [],
          preferredCountries: data.preferredCountries ?? [],
        })
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [reset, t])

  function buildPayload(data: FormData) {
    return {
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
      interestedFaculties: data.interestedFaculties ?? [],
      preferredCountries: data.preferredCountries ?? [],
    }
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    setSaving(true)
    try {
      const updated = await updateStudentProfile(buildPayload(data))
      setProfile(updated)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const handleModalSave = async () => {
    setError('')
    setSaving(true)
    try {
      const data = getValues()
      const updated = await updateStudentProfile(buildPayload(data))
      setProfile(updated)
      setOpenSection(null)
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const verified = user?.studentProfile?.verifiedAt

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-[var(--color-text-muted)]">{t('loadingProfile')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <img
          src={getStudentAvatarUrl(profile?.avatarUrl)}
          alt=""
          className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-border)] flex-shrink-0 bg-[var(--color-border)]"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('portfolioTitle')}</h1>
          {verified && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-600 dark:text-green-400 mt-1" title={t('common:verified')}>
              <span aria-hidden>✓</span> {t('common:verified')}
            </span>
          )}
        </div>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {SECTIONS.map((sec) => {
          const pct = getSectionPercent(profile, sec.id)
          const Icon = sec.icon
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setOpenSection(sec.id)}
              className={cn(
                'flex flex-col items-center gap-3 p-4 rounded-card border-2 border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary-accent)] hover:bg-[var(--color-bg)] transition-colors text-center'
              )}
            >
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-[var(--color-border)] overflow-hidden">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[var(--color-border)]"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                  <path
                    className="text-[var(--color-primary-accent)] transition-all duration-500"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={`${(pct / 100) * 97.4}, 97.4`}
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                </svg>
                <span className="relative text-sm font-semibold text-[var(--color-text)]">{pct}%</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text)]">
                <Icon className="w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium truncate">{t(sec.titleKey)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Modal
        open={!!openSection}
        onClose={() => setOpenSection(null)}
        title={openSection ? t(SECTIONS.find((s) => s.id === openSection)!.titleKey) : ''}
        footer={openSection ? (
          <>
            <Button type="button" variant="secondary" onClick={() => setOpenSection(null)}>
              {t('common:cancel', 'Cancel')}
            </Button>
            <Button type="button" onClick={handleModalSave} disabled={saving} loading={saving}>
              {t('common:save')}
            </Button>
          </>
        ) : undefined}
      >
        <div className="space-y-4">
          {openSection === 'personal' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('firstName')} error={errors.firstName?.message} {...register('firstName')} />
                <Input label={t('lastName')} error={errors.lastName?.message} {...register('lastName')} />
              </div>
              <Input label={t('birthDate')} type="date" error={errors.birthDate?.message} {...register('birthDate')} />
            </>
          )}

          {openSection === 'location' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('country')} error={errors.country?.message} {...register('country')} placeholder={t('country')} />
                <Input label={t('city')} error={errors.city?.message} {...register('city')} placeholder={t('city')} />
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('student:preferredCountries', 'Preferred countries')}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">
                    {t('student:preferredCountriesHint', 'Where would you like to study?')}
                  </p>
                  <ChipSelect
                    options={COUNTRY_CODE_OPTIONS.map((c) => c.label)}
                    value={(watch('preferredCountries') ?? []).map(
                      (code) => COUNTRY_CODE_OPTIONS.find((c) => c.code === code)?.label ?? code
                    )}
                    onChange={(labels) => {
                      const codes = labels
                        .map((label) => COUNTRY_CODE_OPTIONS.find((c) => c.label === label)?.code)
                        .filter((v) => !!v)
                        .map((v) => String(v))
                      setValue('preferredCountries', codes, { shouldDirty: true })
                    }}
                    max={8}
                    placeholder={t('student:preferredCountriesPlaceholder', 'Select countries')}
                  />
                </div>
              </div>
            </>
          )}

          {openSection === 'education' && (
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

          {openSection === 'about' && (
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

          {openSection === 'skills' && (
            <>
              {!criteria ? (
                <p className="text-[var(--color-text-muted)]">Loading options…</p>
              ) : (
                <>
                  <CardTitle className="mb-2">{t('skillsPlaceholder')}</CardTitle>
                  <ChipSelect
                    options={criteria.skills}
                    value={watch('skills') ?? []}
                    onChange={(v) => setValue('skills', v, { shouldDirty: true })}
                    max={50}
                    placeholder={t('skillsPlaceholder')}
                    className="mb-6"
                  />
                  <CardTitle className="mb-2">Interests</CardTitle>
                  <ChipSelect
                    options={criteria.interests}
                    value={watch('interests') ?? []}
                    onChange={(v) => setValue('interests', v, { shouldDirty: true })}
                    max={30}
                    placeholder="Select your interests (e.g. IT, books, travel)"
                    className="mb-6"
                  />
                  <CardTitle className="mb-2">Hobbies & activities</CardTitle>
                  <ChipSelect
                    options={criteria.hobbies}
                    value={watch('hobbies') ?? []}
                    onChange={(v) => setValue('hobbies', v, { shouldDirty: true })}
                    max={30}
                    placeholder="Select hobbies and activities"
                  />
                  <div className="mt-6">
                    <CardTitle className="mb-2">{t('student:interestedFaculties', 'Interested faculties')}</CardTitle>
                    <p className="text-xs text-[var(--color-text-muted)] mb-3">
                      {t('student:interestedFacultiesHint', 'Choose faculties you are interested in. You can open each faculty to see what it includes.')}
                    </p>
                    <div className="space-y-2">
                      {FIELD_OF_STUDY.map((cat) => {
                        const selected = (watch('interestedFaculties') ?? []).includes(cat.id)
                        const open = openFacultyId === cat.id
                        return (
                          <div key={cat.id} className="rounded-input border border-[var(--color-border)] bg-[var(--color-card)]">
                            <div className="flex items-center justify-between gap-3 px-3 py-2">
                              <label className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => {
                                    const current = watch('interestedFaculties') ?? []
                                    const next = e.target.checked
                                      ? Array.from(new Set([...current, cat.id])).slice(0, 10)
                                      : current.filter((x) => x !== cat.id)
                                    setValue('interestedFaculties', next, { shouldDirty: true })
                                  }}
                                />
                        <span className="text-sm font-medium truncate">{t(cat.titleKey)}</span>
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenFacultyId(open ? null : cat.id)}
                              >
                                {open ? t('common:hide', 'Hide') : t('common:view', 'View')}
                              </Button>
                            </div>
                            {open && (
                              <div className="px-3 pb-3">
                                <ul className="text-sm text-[var(--color-text-muted)] list-disc list-inside space-y-0.5">
                                  {cat.items.map((it) => (
                                    <li key={it}>{it}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {openSection === 'experience' && (
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

          {openSection === 'works' && (
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
        </div>
      </Modal>
    </div>
  )
}
