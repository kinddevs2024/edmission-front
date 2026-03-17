import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FileUpload } from '@/components/ui/FileUpload'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import { useTranslation } from 'react-i18next'
import { getStudentProfile, updateMyStudent, getStudentDocuments, addStudentDocument, deleteStudentDocument, type CounsellorStudentDocument } from '@/services/counsellor'
import { getProfileCriteria } from '@/services/options'
import { getApiError } from '@/services/api'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { PageTitle } from '@/components/ui/PageTitle'
import { Plus, Trash2, User, MapPin, GraduationCap, FileText, Sparkles, Briefcase, FolderOpen, BookOpen, ArrowLeft, FileStack } from 'lucide-react'
import { cn } from '@/utils/cn'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
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
  graduationYear: z.preprocess((v) => {
    if (v === '' || v === undefined || v === null) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }, z.number().min(1950).max(2030).optional()),
  gradingScheme: z.string().optional(),
  gradeScale: z.preprocess((v) => {
    if (v === '' || v === undefined || v === null) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }, z.number().optional()),
  highestEducationLevel: z.string().optional(),
  targetDegreeLevel: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['bachelor', 'master', 'phd']).optional()),
  schoolsAttended: z.array(z.object({
    country: z.string().optional(),
    institutionName: z.string().optional(),
    institutionType: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['school', 'university']).optional()),
    educationLevel: z.string().optional(),
    gradingScheme: z.string().optional(),
    gradeScale: z.preprocess((v) => {
      if (v === '' || v === undefined || v === null) return undefined
      const n = Number(v)
      return Number.isFinite(n) ? n : undefined
    }, z.number().optional()),
    gradeAverage: z.preprocess((v) => {
      if (v === '' || v === undefined || v === null) return undefined
      const n = Number(v)
      return Number.isFinite(n) ? n : undefined
    }, z.number().optional()),
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
  budgetAmount: z.preprocess((v) => (v === '' ? undefined : v), z.number().min(0).optional()),
  budgetCurrency: z.string().optional(),
})

type FormData = z.infer<typeof schema>

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

function mapProfileToForm(profile: Record<string, unknown>): Partial<FormData> {
  const schools = (profile.schoolsAttended ?? []) as Array<Record<string, unknown>>
  const exps = (profile.experiences ?? []) as Array<Record<string, unknown>>
  const works = (profile.portfolioWorks ?? []) as Array<Record<string, unknown>>
  const langs = (profile.languages ?? []) as Array<{ language?: string; level?: string }>

  return {
    firstName: (profile.firstName as string) ?? '',
    lastName: (profile.lastName as string) ?? '',
    birthDate: profile.birthDate ? (typeof profile.birthDate === 'string' ? profile.birthDate.slice(0, 10) : new Date(profile.birthDate as Date).toISOString().slice(0, 10)) : '',
    country: (profile.country as string) ?? '',
    city: (profile.city as string) ?? '',
    gradeLevel: (profile.gradeLevel as string) ?? '',
    gpa: profile.gpa as number | undefined,
    languageLevel: (profile.languageLevel as string) ?? '',
    languages: langs.length > 0 ? langs.map((l) => ({ language: l.language ?? '', level: l.level ?? '' })) : [],
    educationStatus: profile.educationStatus as FormData['educationStatus'],
    schoolCompleted: profile.schoolCompleted as boolean | undefined,
    schoolName: (profile.schoolName as string) ?? '',
    graduationYear: profile.graduationYear as number | undefined,
    gradingScheme: (profile.gradingScheme as string) ?? '',
    gradeScale: profile.gradeScale as number | undefined,
    highestEducationLevel: (profile.highestEducationLevel as string) ?? '',
    targetDegreeLevel: profile.targetDegreeLevel as FormData['targetDegreeLevel'],
    schoolsAttended: schools.map((s) => ({
      country: (s.country as string) ?? '',
      institutionName: (s.institutionName as string) ?? '',
      institutionType: (s.institutionType as 'school' | 'university') ?? undefined,
      educationLevel: (s.educationLevel as string) ?? '',
      gradingScheme: (s.gradingScheme as string) ?? '',
      gradeScale: s.gradeScale as number | undefined,
      gradeAverage: s.gradeAverage as number | undefined,
      primaryLanguage: (s.primaryLanguage as string) ?? '',
      attendedFrom: s.attendedFrom ? (typeof s.attendedFrom === 'string' ? s.attendedFrom.slice(0, 10) : new Date(s.attendedFrom as Date).toISOString().slice(0, 10)) : '',
      attendedTo: s.attendedTo ? (typeof s.attendedTo === 'string' ? s.attendedTo.slice(0, 10) : new Date(s.attendedTo as Date).toISOString().slice(0, 10)) : '',
      degreeName: (s.degreeName as string) ?? '',
    })),
    bio: (profile.bio as string) ?? '',
    avatarUrl: (profile.avatarUrl as string) ?? '',
    skills: (profile.skills as string[]) ?? [],
    interests: (profile.interests as string[]) ?? [],
    hobbies: (profile.hobbies as string[]) ?? [],
    experiences: exps.map((e) => {
      const type = (e.type === 'internship' || e.type === 'work' ? e.type : 'volunteer') as 'volunteer' | 'internship' | 'work'
      return {
        type,
        title: (e.title as string) ?? '',
        organization: (e.organization as string) ?? '',
        startDate: e.startDate ? (typeof e.startDate === 'string' ? e.startDate.slice(0, 10) : new Date(e.startDate as Date).toISOString().slice(0, 10)) : '',
        endDate: e.endDate ? (typeof e.endDate === 'string' ? e.endDate.slice(0, 10) : new Date(e.endDate as Date).toISOString().slice(0, 10)) : '',
        description: (e.description as string) ?? '',
      }
    }),
    portfolioWorks: works.map((w) => ({
      title: (w.title as string) ?? '',
      description: (w.description as string) ?? '',
      fileUrl: (w.fileUrl as string) ?? '',
      linkUrl: (w.linkUrl as string) ?? '',
    })),
    interestedFaculties: (profile.interestedFaculties as string[]) ?? [],
    preferredCountries: (profile.preferredCountries as string[]) ?? [],
    budgetAmount: profile.budgetAmount as number | undefined,
    budgetCurrency: (profile.budgetCurrency as string) ?? 'USD',
  }
}

function buildPayload(data: FormData): Record<string, unknown> {
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
    graduationYear: data.graduationYear != null ? Number(data.graduationYear) : undefined,
    gradingScheme: data.gradingScheme || undefined,
    gradeScale: data.gradeScale != null ? Number(data.gradeScale) : undefined,
    highestEducationLevel: data.highestEducationLevel || undefined,
    targetDegreeLevel: data.targetDegreeLevel || undefined,
    schoolsAttended: (data.schoolsAttended ?? []).map((s) => ({
      country: s.country || undefined,
      institutionType: s.institutionType || undefined,
      institutionName: s.institutionName || undefined,
      educationLevel: s.educationLevel || undefined,
      gradingScheme: s.gradingScheme || undefined,
      gradeScale: s.gradeScale != null ? Number(s.gradeScale) : undefined,
      gradeAverage: s.gradeAverage != null ? Number(s.gradeAverage) : undefined,
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
    budgetAmount: data.budgetAmount != null ? data.budgetAmount : undefined,
    budgetCurrency: data.budgetCurrency || undefined,
  }
}

export function CounsellorStudentProfile() {
  const { studentId } = useParams<{ studentId: string }>()
  const { t } = useTranslation(['student', 'common'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [criteria, setCriteria] = useState<{ skills: string[]; interests: string[]; hobbies: string[] } | null>(null)
  const [newLanguage, setNewLanguage] = useState(LANGUAGE_OPTIONS[0].value)
  const [newLevel, setNewLevel] = useState(LEVEL_OPTIONS[0])
  const [customLanguageName, setCustomLanguageName] = useState('')
  const [openFacultyId, setOpenFacultyId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<CounsellorStudentDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [docAdding, setDocAdding] = useState(false)
  const [docType, setDocType] = useState<string>('transcript')
  const [docName, setDocName] = useState('')
  const [docCertificateType, setDocCertificateType] = useState('IELTS')
  const [docScore, setDocScore] = useState('')
  const [docFileUrl, setDocFileUrl] = useState('')
  const [previewDocument, setPreviewDocument] = useState<CounsellorStudentDocument | null>(null)

  const DOC_TYPES = [
    { value: 'transcript', label: 'Transcript' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'language_certificate', label: 'Language certificate' },
    { value: 'course_certificate', label: 'Course certificate' },
    { value: 'passport', label: 'Passport' },
    { value: 'id_card', label: 'ID card' },
    { value: 'other', label: 'Other' },
  ]
  const LANGUAGE_CERT_TYPES = [
    { value: 'IELTS', label: 'IELTS' },
    { value: 'TOEFL', label: 'TOEFL' },
    { value: 'Cambridge', label: 'Cambridge' },
    { value: 'Duolingo', label: 'Duolingo' },
    { value: 'other', label: 'Other' },
  ]

  const { register, reset, control, watch, setValue, handleSubmit, formState: { errors } } = useForm<FormData>({
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
      budgetAmount: undefined,
      budgetCurrency: 'USD',
    },
  })

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: 'experiences' })
  const { fields: schoolsAttendedFields, append: appendSchool, remove: removeSchool } = useFieldArray({ control, name: 'schoolsAttended' })
  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({ control, name: 'portfolioWorks' })
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({ control, name: 'languages' })

  const avatarUrl = watch('avatarUrl')
  const educationStatus = watch('educationStatus')
  const educationStatusOptions = EDUCATION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const targetDegreeOptions = TARGET_DEGREE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const gradingSchemeOptions = GRADING_SCHEME_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const gradeScaleOptions = GRADE_SCALE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))
  const highestEducationOptions = HIGHEST_EDUCATION_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const institutionTypeOptions = [
    { value: 'school', label: t('institutionTypeSchool') },
    { value: 'university', label: t('institutionTypeUniversity') },
  ]
  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'UZS', label: 'UZS' },
    { value: 'KZT', label: 'KZT' },
    { value: 'RUB', label: 'RUB' },
  ]
  const experienceTypeOptions = [
    { value: 'volunteer', label: t('volunteer') },
    { value: 'internship', label: t('internship') },
    { value: 'work', label: t('work') },
  ]
  const languageOptions = LANGUAGE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))
  const levelOptions = LEVEL_OPTIONS.map((opt) => ({ value: opt, label: opt }))

  useEffect(() => {
    getProfileCriteria().then(setCriteria).catch(() => setCriteria({ skills: [], interests: [], hobbies: [] }))
  }, [])

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    setError('')
    getStudentProfile(studentId)
      .then((data) => {
        setProfile(data)
        reset(mapProfileToForm(data))
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [studentId, reset])

  const loadDocuments = () => {
    if (!studentId) return
    setDocumentsLoading(true)
    getStudentDocuments(studentId)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setDocumentsLoading(false))
  }

  useEffect(() => {
    if (studentId) loadDocuments()
  }, [studentId])

  const handleAddDocument = async () => {
    if (!studentId || !docFileUrl.trim()) return
    const name = docName.trim() || docType.replace(/_/g, ' ')
    setDocAdding(true)
    try {
      await addStudentDocument(studentId, {
        type: docType,
        fileUrl: docFileUrl,
        name: name || undefined,
        certificateType: docType === 'language_certificate' ? docCertificateType : undefined,
        score: docType === 'language_certificate' ? docScore : undefined,
      })
      setDocName('')
      setDocScore('')
      setDocFileUrl('')
      loadDocuments()
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setDocAdding(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!studentId) return
    try {
      await deleteStudentDocument(studentId, docId)
      loadDocuments()
    } catch (e) {
      setError(getApiError(e).message)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!studentId) return
    setError('')
    setSaving(true)
    try {
      await updateMyStudent(studentId, buildPayload(data))
      const updated = await getStudentProfile(studentId)
      setProfile(updated)
      reset(mapProfileToForm(updated))
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const name = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || t('student:studentLabel', 'Student') : t('student:studentLabel', 'Student')

  if (!studentId) {
    return (
      <div className="space-y-4">
        <Link to="/school/my-students">
          <Button variant="ghost" icon={<ArrowLeft size={16} />}>{t('common:back')}</Button>
        </Link>
        <p className="text-[var(--color-text-muted)]">{t('common:invalidStudent', 'Invalid student.')}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Link to="/school/my-students">
          <Button variant="ghost" icon={<ArrowLeft size={16} />}>{t('common:back')}</Button>
        </Link>
        <p className="text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="space-y-4">
        <Link to="/school/my-students">
          <Button variant="ghost" icon={<ArrowLeft size={16} />}>{t('common:back')}</Button>
        </Link>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/school/my-students">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>{t('common:back')}</Button>
        </Link>
      </div>

      <PageTitle title={name} icon="User" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Personal */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('stepPersonal', 'Personal')}
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input label={t('firstName')} error={errors.firstName?.message} {...register('firstName')} />
            <Input label={t('lastName')} error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label={t('birthDate')} type="date" error={errors.birthDate?.message} {...register('birthDate')} className="mt-4" />
        </Card>

        {/* Location */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {t('stepLocation', 'Location')}
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input label={t('country')} error={errors.country?.message} {...register('country')} placeholder={t('country')} />
            <Input label={t('city')} error={errors.city?.message} {...register('city')} placeholder={t('city')} />
          </div>
          <div className="mt-4">
            <p className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('student:preferredCountries', 'Preferred countries')}</p>
            <ChipSelect
              options={COUNTRY_CODE_OPTIONS.map((c) => c.label)}
              value={(watch('preferredCountries') ?? []).map(
                (code) => COUNTRY_CODE_OPTIONS.find((c) => c.code === code)?.label ?? code
              )}
              onChange={(labels) => {
                const codes = labels
                  .map((label) => COUNTRY_CODE_OPTIONS.find((c) => c.label === label)?.code)
                  .filter((c): c is (typeof COUNTRY_CODE_OPTIONS)[number]['code'] => c != null)
                setValue('preferredCountries', codes as string[], { shouldDirty: true })
              }}
              max={8}
              placeholder={t('student:preferredCountriesPlaceholder', 'Select countries')}
            />
          </div>
        </Card>

        {/* Education */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            {t('stepEducation', 'Education')}
          </CardTitle>
          <div className="space-y-4 mt-4">
            <Select label={t('educationStatusLabel')} options={educationStatusOptions} placeholder="—" {...register('educationStatus')} />
            <Select label={t('applyingForDegree')} options={targetDegreeOptions} placeholder="—" {...register('targetDegreeLevel')} />
            <Input label={t('gradeLevel')} error={errors.gradeLevel?.message} {...register('gradeLevel')} placeholder={t('gradePlaceholder')} />
            <Input label={t('gpa')} type="number" step="0.01" min={0} max={4} error={errors.gpa?.message} {...register('gpa')} />
            <Input label={t('schoolName')} {...register('schoolName')} placeholder={t('schoolName')} />
            <Input label={t('graduationYear')} type="number" min={1950} max={2030} {...register('graduationYear')} placeholder="2024" />
            <Select label={t('gradingScheme')} options={gradingSchemeOptions} placeholder="—" {...register('gradingScheme')} />
            <Select label={t('gradeScaleOutOf')} options={gradeScaleOptions} placeholder="—" {...register('gradeScale')} />
            <Select label={t('highestLevelOfEducation')} options={highestEducationOptions} placeholder="—" {...register('highestEducationLevel')} />

            {/* Languages */}
            <div className="pt-4 border-t border-[var(--color-border)]">
              <p className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('addLanguage')}</p>
              {languageFields.length > 0 && (
                <ul className="space-y-2 mb-3" role="list">
                  {languageFields.map((field, i) => (
                    <li key={field.id} className="flex flex-wrap items-center gap-3 py-2 px-3 rounded-lg border border-[var(--color-border)]">
                      <span className="font-medium text-[var(--color-text)]">{watch(`languages.${i}.language`)}</span>
                      <span className="text-sm text-[var(--color-text-muted)]">{watch(`languages.${i}.level`)}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLanguage(i)} className="ml-auto"><Trash2 className="w-4 h-4" /></Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-[140px]">
                  <Select value={newLanguage} onChange={(e) => { setNewLanguage(e.target.value); if (e.target.value !== 'Other') setCustomLanguageName('') }} options={languageOptions} />
                </div>
                {newLanguage === 'Other' && (
                  <Input type="text" value={customLanguageName} onChange={(e) => setCustomLanguageName(e.target.value)} placeholder="Language name" className="min-w-[120px]" />
                )}
                <Select value={newLevel} onChange={(e) => setNewLevel(e.target.value)} options={levelOptions} className="min-w-[96px]" />
                <Button type="button" size="sm" onClick={() => { const langToAdd = newLanguage === 'Other' ? customLanguageName.trim() : newLanguage; if (!langToAdd) return; appendLanguage({ language: langToAdd, level: newLevel }); if (newLanguage === 'Other') setCustomLanguageName('') }} icon={<Plus className="w-4 h-4" />} disabled={newLanguage === 'Other' && !customLanguageName.trim()}>
                  {t('common:add', 'Add')}
                </Button>
              </div>
            </div>

            {/* Schools attended */}
            <div className="pt-4 border-t border-[var(--color-border)]">
              <p className="text-sm font-medium text-[var(--color-text)] mb-3">{t('schoolsUniversitiesAttended')}</p>
              {schoolsAttendedFields.map((field, i) => (
                <Card key={field.id} className="p-4 mb-3 border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t('entryNumber', { n: i + 1 })}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSchool(i)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <Select label={t('institutionTypeLabel')} options={institutionTypeOptions} placeholder="—" {...register(`schoolsAttended.${i}.institutionType`)} />
                  <Input label={t('country')} {...register(`schoolsAttended.${i}.country`)} />
                  <Input label={t('schoolName')} {...register(`schoolsAttended.${i}.institutionName`)} />
                  <Input label={t('gradeLevel')} {...register(`schoolsAttended.${i}.educationLevel`)} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input label={t('startDate')} type="date" {...register(`schoolsAttended.${i}.attendedFrom`)} />
                    <Input label={t('endDate')} type="date" {...register(`schoolsAttended.${i}.attendedTo`)} />
                  </div>
                </Card>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => appendSchool({ country: '', institutionName: '', institutionType: (educationStatus === 'in_university' || educationStatus === 'finished_university') ? 'university' : 'school', educationLevel: '', primaryLanguage: '', attendedFrom: '', attendedTo: '', degreeName: '' })} icon={<Plus className="w-4 h-4" />}>
                {t('addSchoolUniversity', 'Add school / university')}
              </Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('stepAbout', 'About')}
          </CardTitle>
          <div className="space-y-4 mt-4">
            <Textarea label={t('bio')} placeholder={t('bioPlaceholder')} rows={4} {...register('bio')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('student:budgetAmount', 'Budget')}</label>
                <Input type="number" min={0} step={100} {...register('budgetAmount', { valueAsNumber: true })} />
              </div>
              <div>
                <Select label={t('student:budgetCurrency', 'Currency')} options={currencyOptions} {...register('budgetCurrency')} />
              </div>
            </div>
            <FileUpload label={t('avatarUrl')} variant="avatar" value={avatarUrl} onChange={(url) => setValue('avatarUrl', url)} hint={t('uploadPhotoOrLink')} />
          </div>
        </Card>

        {/* Skills, Interests, Hobbies */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t('stepSkills', 'Skills & Interests')}
          </CardTitle>
          <div className="space-y-4 mt-4">
            {!criteria ? (
              <p className="text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
            ) : (
              <>
                <div>
                  <p className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('skillsPlaceholder')}</p>
                  <ChipSelect options={criteria.skills} value={watch('skills') ?? []} onChange={(v) => setValue('skills', v, { shouldDirty: true })} max={50} placeholder={t('skillsPlaceholder')} />
                </div>
                <div>
                  <p className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('student:interestsBlock', 'Interests')}</p>
                  <ChipSelect options={criteria.interests} value={watch('interests') ?? []} onChange={(v) => setValue('interests', v, { shouldDirty: true })} max={30} placeholder={t('student:interestsPlaceholder', 'Select interests')} />
                </div>
                <div>
                  <p className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('student:hobbiesBlock', 'Hobbies')}</p>
                  <ChipSelect options={criteria.hobbies} value={watch('hobbies') ?? []} onChange={(v) => setValue('hobbies', v, { shouldDirty: true })} max={30} placeholder={t('student:hobbiesPlaceholder', 'Select hobbies')} />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Interested faculties */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {t('stepFaculties', 'Interested faculties')}
          </CardTitle>
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            {FIELD_OF_STUDY.map((cat) => {
              const selected = (watch('interestedFaculties') ?? []).includes(cat.id)
              const open = openFacultyId === cat.id
              return (
                <div key={cat.id} className={cn('rounded-card border-2 p-3 transition-all', selected ? 'border-primary-accent' : 'border-[var(--color-border)]')}>
                  <div className="flex items-center justify-between gap-2">
                    <Checkbox
                      checked={selected}
                      onChange={(e) => {
                        const current = watch('interestedFaculties') ?? []
                        const next = e.target.checked ? [...new Set([...current, cat.id])].slice(0, 10) : current.filter((x) => x !== cat.id)
                        setValue('interestedFaculties', next, { shouldDirty: true })
                      }}
                      label={<span className="text-sm font-medium truncate">{t(cat.titleKey)}</span>}
                      className="flex-1 min-w-0"
                    />
                    <button type="button" onClick={() => setOpenFacultyId(open ? null : cat.id)} className="p-1 rounded" aria-expanded={open}>
                      <svg className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {open && (
                    <ul className="text-xs text-[var(--color-text-muted)] mt-2 pl-4 space-y-1">
                      {cat.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Experience */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            {t('stepExperience', 'Experience')}
          </CardTitle>
          <div className="space-y-4 mt-4">
            {experienceFields.map((field, i) => (
              <Card key={field.id} className="p-4 border border-[var(--color-border)]">
                <div className="flex justify-between items-center mb-2">
                  <Select options={experienceTypeOptions} {...register(`experiences.${i}.type`)} className="min-w-[180px]" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeExperience(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Input label={t('title')} {...register(`experiences.${i}.title`)} />
                <Input label={t('organization')} {...register(`experiences.${i}.organization`)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label={t('startDate')} type="date" {...register(`experiences.${i}.startDate`)} />
                  <Input label={t('endDate')} type="date" {...register(`experiences.${i}.endDate`)} />
                </div>
                <Textarea label={t('description')} placeholder={t('description')} rows={3} {...register(`experiences.${i}.description`)} />
              </Card>
            ))}
            <Button type="button" variant="secondary" onClick={() => appendExperience({ type: 'volunteer', title: '', organization: '', startDate: '', endDate: '', description: '' })} icon={<Plus className="w-4 h-4" />}>
              {t('addExperience')}
            </Button>
          </div>
        </Card>

        {/* Portfolio works */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            {t('stepWorks', 'Portfolio / Works')}
          </CardTitle>
          <div className="space-y-4 mt-4">
            {workFields.map((field, i) => (
              <Card key={field.id} className="p-4 border border-[var(--color-border)]">
                <div className="flex justify-end mb-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeWork(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Input label={t('workTitle')} {...register(`portfolioWorks.${i}.title`)} />
                <Textarea label={t('workDescription')} placeholder={t('workDescription')} rows={2} {...register(`portfolioWorks.${i}.description`)} />
                <FileUpload label={t('workFileOrLink')} value={watch(`portfolioWorks.${i}.fileUrl`)} onChange={(url) => setValue(`portfolioWorks.${i}.fileUrl`, url)} accept="image/*,application/pdf" />
                <Input {...register(`portfolioWorks.${i}.linkUrl`)} placeholder="https://… (optional)" className="mt-2" />
              </Card>
            ))}
            <Button type="button" variant="secondary" onClick={() => appendWork({ title: '', description: '', fileUrl: '', linkUrl: '' })} icon={<Plus className="w-4 h-4" />}>
              {t('addWork')}
            </Button>
          </div>
        </Card>

        {/* Documents (certificates, transcripts, etc.) */}
        <Card className="p-4">
          <CardTitle className="flex items-center gap-2">
            <FileStack className="w-4 h-4" />
            {t('common:documents', 'Documents')}
          </CardTitle>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {t('student:documentsHint', 'Add transcripts, diplomas, language certificates, passport, etc.')}
          </p>
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">{t('student:documentType', 'Document type')}</label>
                <select
                  value={docType}
                  onChange={(e) => { setDocType(e.target.value); if (e.target.value !== 'language_certificate') setDocScore('') }}
                  className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                >
                  {DOC_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Input label={t('student:documentName', 'Name')} value={docName} onChange={(e) => setDocName(e.target.value)} placeholder={docType === 'language_certificate' ? 'e.g. IELTS' : 'e.g. High school diploma'} />
              </div>
            </div>
            {docType === 'language_certificate' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('student:certificateType', 'Certificate type')}</label>
                  <select
                    value={docCertificateType}
                    onChange={(e) => setDocCertificateType(e.target.value)}
                    className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                  >
                    {LANGUAGE_CERT_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <Input label={t('student:score', 'Score / level')} value={docScore} onChange={(e) => setDocScore(e.target.value)} placeholder="e.g. 7.0, B2" />
              </div>
            )}
            <FileUpload label={t('student:file', 'File')} value={docFileUrl} onChange={setDocFileUrl} accept="image/*,application/pdf" />
            <Button type="button" size="sm" onClick={handleAddDocument} disabled={docAdding || !docFileUrl.trim()} loading={docAdding} icon={<Plus className="w-4 h-4" />}>
              {t('common:add', 'Add')} {t('common:documents', 'document')}
            </Button>
            {documentsLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t('student:noDocumentsYet', 'No documents yet.')}</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {documents.map((d) => (
                  <li key={d.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />
                      <span className="font-medium truncate">{d.name || d.type.replace(/_/g, ' ')}</span>
                      {d.type === 'language_certificate' && (d.certificateType || d.score) && (
                        <span className="text-xs text-[var(--color-text-muted)] shrink-0">{[d.certificateType, d.score].filter(Boolean).join(' — ')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" className="text-sm text-primary-accent hover:underline" onClick={() => setPreviewDocument(d)}>{t('common:view')}</button>
                      <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteDocument(d.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="flex justify-end pb-4">
          <Button type="submit" disabled={saving} loading={saving}>{t('common:save')}</Button>
        </div>
      </form>

      <DocumentPreviewModal
        open={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        title={previewDocument?.name ?? previewDocument?.type ?? 'Document'}
        document={previewDocument ? {
          fileUrl: previewDocument.fileUrl,
          canvasJson: previewDocument.canvasJson,
          pageFormat: previewDocument.pageFormat,
          width: previewDocument.width,
          height: previewDocument.height,
        } : null}
      />
    </div>
  )
}
