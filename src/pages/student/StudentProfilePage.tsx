import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FileUpload } from '@/components/ui/FileUpload'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getStudentProfile, updateStudentProfile, type StudentProfileData, type StudentExperience, type StudentPortfolioWork } from '@/services/student'
import { getProfileCriteria } from '@/services/options'
import { getApiError } from '@/services/auth'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, User, MapPin, GraduationCap, FileText, Sparkles, Briefcase, FolderOpen, BookOpen, ChevronDown, ChevronRight, Check, Circle, ExternalLink, Lock } from 'lucide-react'
import { cn } from '@/utils/cn'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { getStudentAvatarUrl } from '@/services/upload'
import { PageTitle } from '@/components/ui/PageTitle'
import { notifySuccess } from '@/utils/notify'

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
  budgetAmount: z.preprocess((v) => (v === '' ? undefined : v), z.number().min(0).optional()),
  budgetCurrency: z.string().optional(),
  profileVisibility: z.enum(['private', 'public']),
})

type FormData = z.infer<typeof schema>

type SectionId = 'personal' | 'location' | 'education' | 'about' | 'skills' | 'faculties' | 'experience' | 'works' | 'privacy'

const SECTIONS: { id: SectionId; titleKey: string; icon: typeof User | typeof Lock }[] = [
  { id: 'personal', titleKey: 'stepPersonal', icon: User },
  { id: 'privacy', titleKey: 'stepPrivacy', icon: Lock },
  { id: 'location', titleKey: 'stepLocation', icon: MapPin },
  { id: 'education', titleKey: 'stepEducation', icon: GraduationCap },
  { id: 'about', titleKey: 'stepAbout', icon: FileText },
  { id: 'skills', titleKey: 'stepSkills', icon: Sparkles },
  { id: 'faculties', titleKey: 'stepFaculties', icon: BookOpen },
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
      const core = [hasCountry, hasCity].filter(Boolean).length
      const bonus = hasPreferred ? 0.1 : 0
      return Math.min(100, Math.round(((core / 2) + bonus) * 100))
    }
    case 'education': {
      const checks = [
        profile.educationStatus,
        profile.targetDegreeLevel,
        (profile.gradeLevel != null && String(profile.gradeLevel).trim() !== '') || Number.isFinite(profile.gpa),
        (Array.isArray(profile.languages) && profile.languages.length > 0) || (profile.languageLevel != null && String(profile.languageLevel).trim() !== ''),
        (profile.schoolName != null && String(profile.schoolName).trim() !== '') || (Array.isArray(profile.schoolsAttended) && profile.schoolsAttended.length > 0),
      ]
      return Math.round((checks.filter(Boolean).length / 5) * 100)
    }
    case 'about': {
      const bio = profile.bio != null && String(profile.bio).trim() !== ''
      const avatar = profile.avatarUrl != null && String(profile.avatarUrl).trim() !== ''
      const budget = profile.budgetAmount != null && Number(profile.budgetAmount) >= 0
      return Math.round(([bio, avatar, budget].filter(Boolean).length / 3) * 100)
    }
    case 'skills': {
      const n = [
        Array.isArray(profile.skills) && profile.skills.length > 0,
        Array.isArray(profile.interests) && profile.interests.length > 0,
        Array.isArray(profile.hobbies) && profile.hobbies.length > 0,
      ].filter(Boolean).length
      return Math.round((n / 3) * 100)
    }
    case 'faculties': {
      const count = Array.isArray(profile.interestedFaculties) ? profile.interestedFaculties.length : 0
      return Math.min(100, Math.round((count / 10) * 100))
    }
    case 'experience':
      return Array.isArray(profile.experiences) && profile.experiences.length > 0 ? 100 : 0
    case 'works':
      return Array.isArray(profile.portfolioWorks) && profile.portfolioWorks.length > 0 ? 100 : 0
    case 'privacy':
      return 100
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

function FacultyMarqueeLabel({ text }: { text: string }) {
  const containerRef = useRef<HTMLSpanElement | null>(null)
  const [shiftPx, setShiftPx] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const update = () => {
      const overflow = Math.max(0, node.scrollWidth - node.clientWidth)
      setShiftPx(overflow > 0 ? overflow + 20 : 0)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    window.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [text])

  return (
    <span
      ref={containerRef}
      className={cn('faculty-marquee-wrap text-sm font-medium text-[var(--color-text)]', shiftPx > 0 && 'is-overflow')}
      style={{ ['--faculty-marquee-shift' as string]: `${shiftPx}px` }}
    >
      <span className="faculty-marquee-text">{text}</span>
    </span>
  )
}

function hasFilledValue(value: unknown) {
  return value != null && String(value).trim() !== ''
}

function getMinimalChecklist(profile: StudentProfileData | null, t: (key: string, defaultValue?: string) => string) {
  const hasName = Boolean(hasFilledValue(profile?.firstName) || hasFilledValue(profile?.lastName))
  const hasLocation = Boolean(hasFilledValue(profile?.country) || hasFilledValue(profile?.city))
  const hasEducation =
    Boolean(hasFilledValue(profile?.educationStatus)) &&
    Boolean(
      hasFilledValue(profile?.schoolName) ||
      hasFilledValue(profile?.gradeLevel) ||
      profile?.graduationYear != null ||
      (profile?.schoolsAttended?.some((item) => hasFilledValue(item.institutionName)) ?? false)
    )

  return [
    { label: t('student:minProfileName', 'Name'), done: hasName },
    { label: t('student:minProfileLocation', 'Location'), done: hasLocation },
    { label: t('student:minProfileEducation', 'Education'), done: hasEducation },
  ]
}
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
  const { t } = useTranslation('student', { useSuspense: false })
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
  const [displayPercent, setDisplayPercent] = useState(0)
  const [educationShowAdvanced, setEducationShowAdvanced] = useState(false)
  const sectionSnapshotRef = useRef('')

  const { register, reset, control, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
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
      profileVisibility: 'private',
    },
  })

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: 'experiences' })
  const { fields: schoolsAttendedFields, append: appendSchool, remove: removeSchool } = useFieldArray({ control, name: 'schoolsAttended' })
  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({ control, name: 'portfolioWorks' })
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({ control, name: 'languages' })

  const avatarUrl = watch('avatarUrl')
  const educationStatus = watch('educationStatus')
  const targetDegreeLevel = watch('targetDegreeLevel')
  const educationStepOneDone = Boolean(educationStatus)
  const educationStepTwoDone = Boolean(
    educationStatus && (
      hasFilledValue(watch('schoolName')) ||
      hasFilledValue(watch('gradeLevel')) ||
      watch('graduationYear') != null
    )
  )
  const needsDegreeGoal = educationStatus === 'in_university' || educationStatus === 'finished_university'
  const educationStepThreeDone = needsDegreeGoal ? Boolean(targetDegreeLevel) : true
  const educationStepFourDone = (watch('languages')?.length ?? 0) > 0 || hasFilledValue(watch('languageLevel'))
  const educationVisibleSteps = needsDegreeGoal ? 4 : 3
  const educationCompletedSteps = [
    educationStepOneDone,
    educationStepTwoDone,
    ...(needsDegreeGoal ? [educationStepThreeDone] : []),
    educationStepFourDone,
  ].filter(Boolean).length
  const gradingSchemeOptions = GRADING_SCHEME_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const gradeScaleOptions = GRADE_SCALE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))
  const highestEducationOptions = HIGHEST_EDUCATION_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const targetDegreeOptions = TARGET_DEGREE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
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
    const target = profile?.portfolioCompletionPercent ?? 0
    const t = setTimeout(() => setDisplayPercent(target), 80)
    return () => clearTimeout(t)
  }, [profile?.portfolioCompletionPercent])

  useEffect(() => {
    getStudentProfile()
      .then((data) => {
        setProfile(data)
        reset(mapProfileToFormData(data))
      })
      .catch((e) => setError(getApiError(e).message))
      .finally(() => setLoading(false))
  }, [reset, t])

  const hasUnsavedChanges = useMemo(() => {
    if (!openSection) return false
    return sectionSnapshotRef.current !== JSON.stringify(getValues())
  }, [getValues, openSection, watch()])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!openSection) return
    sectionSnapshotRef.current = JSON.stringify(getValues())
  }, [getValues, openSection])

  function toDateInputValue(value: unknown): string {
    if (!value) return ''
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return ''
      const directMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/)
      if (directMatch) return directMatch[0]
      const parsed = new Date(trimmed)
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10)
    }
    const parsed = new Date(String(value))
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
  }

  function mapProfileToFormData(data: StudentProfileData): FormData {
    return {
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      birthDate: toDateInputValue(data.birthDate),
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
        attendedFrom: toDateInputValue(s.attendedFrom),
        attendedTo: toDateInputValue(s.attendedTo),
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
          startDate: toDateInputValue(e.startDate),
          endDate: toDateInputValue(e.endDate),
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
      budgetAmount: data.budgetAmount,
      budgetCurrency: data.budgetCurrency ?? 'USD',
      profileVisibility: data.profileVisibility === 'public' ? 'public' : 'private',
    }
  }

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
      profileVisibility: data.profileVisibility,
    }
  }

  const handleModalSave = async () => {
    setError('')
    setSaving(true)
    try {
      const data = getValues()
      const updated = await updateStudentProfile(buildPayload(data))
      setProfile(updated)
      reset(mapProfileToFormData(updated))
      sectionSnapshotRef.current = JSON.stringify(mapProfileToFormData(updated))
      setOpenSection(null)
      notifySuccess(t('common:saved', 'Saved'))
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const verified = user?.studentProfile?.verifiedAt
  const minimalChecklist = getMinimalChecklist(profile, t)
  const minimalChecklistDone = minimalChecklist.filter((item) => item.done).length
  const closeSection = () => {
    if (hasUnsavedChanges && !saving && !window.confirm(t('common:unsavedChanges', 'You have unsaved changes. Close without saving?'))) {
      return
    }
    if (profile) reset(mapProfileToFormData(profile))
    setOpenSection(null)
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-72 rounded-card bg-[var(--color-border)] animate-pulse" />
        <div className="h-24 rounded-card bg-[var(--color-border)] animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-28 rounded-card bg-[var(--color-border)] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5 min-h-0">
      <PageTitle title={t('portfolioTitle')} icon="User" />
      <div className="flex flex-wrap items-center gap-4" data-onboarding="student-profile-overview">
        <Link
          to="/profile"
          className="block shrink-0 rounded-full transition-[box-shadow,transform] hover:scale-[1.02] hover:ring-2 hover:ring-primary-accent/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
          aria-label={t('common:profile')}
          title={t('common:profile')}
        >
          <img
            src={getStudentAvatarUrl(profile?.avatarUrl)}
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[var(--color-border)] bg-[var(--color-border)]"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
            {[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || t('portfolioTitle')}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {[profile?.firstName, profile?.lastName].filter(Boolean).length > 0 ? t('portfolioTitle') : null}
          </p>
          {verified && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-600 dark:text-green-400 mt-1" title={t('common:verified')}>
              <span aria-hidden>✓</span> {t('common:verified')}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
        {t('portfolioIntro')}
      </p>

      <Card className="p-4 sm:p-5 animate-card-enter shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-base text-[var(--color-text-muted)]">{t('portfolioCompletion')}</p>
            <p className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mt-0.5">
              {profile?.portfolioCompletionPercent ?? 0}%
            </p>
          </div>
          <div className="flex-1 w-full sm:max-w-[280px] h-4 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-primary-accent)] transition-all duration-500 ease-out"
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        </div>
      </Card>

      {!profile?.minimalPortfolioComplete && (
        <Card className="p-4 sm:p-5 border-primary-accent/25 bg-[var(--color-card)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {t('student:minProfileUnlockTitle', 'Complete the minimum profile to unlock universities')}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {t('student:minProfileUnlockDesc', 'Fill the 3 required parts first: name, location, and education.')}
              </p>
            </div>
            <div className="text-sm font-medium text-primary-accent">
              {minimalChecklistDone}/{minimalChecklist.length}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {minimalChecklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-3">
                {item.done ? (
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                )}
                <span className={cn('text-sm', item.done ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]')}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {SECTIONS.map((sec) => {
          const isFaculties = sec.id === 'faculties'
          const facultiesSelected = (profile?.interestedFaculties?.length ?? 0) > 0
          const pct = getSectionPercent(profile, sec.id)
          const Icon = sec.icon
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                if (profile) reset(mapProfileToFormData(profile))
                setOpenSection(sec.id)
              }}
              className={cn(
                'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary-accent)] hover:bg-[var(--color-bg)] hover:scale-[1.02] hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99] transition-all duration-200 text-center min-h-[110px]'
              )}
            >
                <div className={cn(
                  'relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center overflow-hidden bg-[var(--color-border)] shrink-0',
                isFaculties && facultiesSelected && 'ring-2 ring-green-500/50 !bg-green-500/10'
              )}>
                {isFaculties ? (
                  <>
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
                      <path
                        className={facultiesSelected ? 'text-green-500' : 'text-[var(--color-border)]'}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                      />
                    </svg>
                    <span className="relative flex items-center justify-center">
                      {facultiesSelected ? (
                        <Check className="w-8 h-8 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                      ) : (
                        <Icon className="w-8 h-8 text-[var(--color-text-muted)]" />
                      )}
                    </span>
                  </>
                ) : (
                  <>
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
                    <span className="relative text-sm sm:text-base font-semibold text-[var(--color-text)]">{pct}%</span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[var(--color-text)] w-full min-h-[2rem]">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-[var(--color-text-muted)]" />
                <span className="text-sm sm:text-base font-medium text-center line-clamp-2">{t(sec.titleKey)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Modal
        open={!!openSection}
        onClose={closeSection}
        title={openSection ? t(SECTIONS.find((s) => s.id === openSection)!.titleKey) : ''}
        footer={openSection ? (
          <>
            <Button type="button" variant="secondary" onClick={closeSection}>
              {t('common:cancel', 'Cancel')}
            </Button>
            <Button type="button" onClick={handleModalSave} disabled={saving || !hasUnsavedChanges} loading={saving}>
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

          {openSection === 'privacy' && (
            <>
              <p className="text-sm font-medium text-[var(--color-text)]">{t('profileVisibilityTitle')}</p>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{t('profileVisibilityHint')}</p>
              <div className="space-y-4 mt-2">
                <label className="flex gap-3 items-start cursor-pointer rounded-card border border-[var(--color-border)] p-3 has-[:checked]:border-primary-accent/50 has-[:checked]:bg-primary-accent/5">
                  <input type="radio" value="private" className="mt-1" {...register('profileVisibility')} />
                  <span>
                    <span className="font-medium text-[var(--color-text)] block">{t('profileVisibilityPrivate')}</span>
                    <span className="text-sm text-[var(--color-text-muted)]">{t('profileVisibilityPrivateLong')}</span>
                  </span>
                </label>
                <label className="flex gap-3 items-start cursor-pointer rounded-card border border-[var(--color-border)] p-3 has-[:checked]:border-primary-accent/50 has-[:checked]:bg-primary-accent/5">
                  <input type="radio" value="public" className="mt-1" {...register('profileVisibility')} />
                  <span>
                    <span className="font-medium text-[var(--color-text)] block">{t('profileVisibilityPublic')}</span>
                    <span className="text-sm text-[var(--color-text-muted)]">{t('profileVisibilityPublicLong')}</span>
                  </span>
                </label>
              </div>
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
              <div className="mb-6 rounded-2xl border border-[var(--color-primary-accent)]/20 bg-[var(--color-primary-accent)]/5 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {t('student:educationProgressTitle', 'Education setup progress')}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {t('student:educationProgressHint', 'Complete these steps so we can unlock the right universities for you.')}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--color-card)] px-3 py-1 text-sm font-semibold text-[var(--color-text)]">
                    {educationCompletedSteps}/{educationVisibleSteps}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-card)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary-accent)] transition-all"
                    style={{ width: `${(educationCompletedSteps / educationVisibleSteps) * 100}%` }}
                  />
                </div>
              </div>

              <Card className="mb-5 p-5 border border-[var(--color-border)]">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-accent)] text-sm font-semibold text-white">1</div>
                  <div>
                    <p className="text-base font-semibold text-[var(--color-text)]">{t('student:whoAreYouTitle', 'Who are you?')}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{t('student:whoAreYouHint', 'Choose your current study stage first.')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EDUCATION_STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        setValue('educationStatus', o.value, { shouldDirty: true })
                        if (o.value === 'in_school') {
                          setValue('targetDegreeLevel', undefined, { shouldDirty: true })
                        }
                      }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left text-sm font-medium transition-all',
                        educationStatus === o.value
                          ? 'border-[var(--color-primary-accent)] bg-[var(--color-primary-accent)]/10 text-[var(--color-text)]'
                          : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-accent)]/50'
                      )}
                    >
                      {t(o.labelKey)}
                    </button>
                  ))}
                </div>
              </Card>

              {educationStepOneDone && (
                <Card className="mb-5 p-5 border border-[var(--color-border)]">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-accent)] text-sm font-semibold text-white">2</div>
                    <div>
                      <p className="text-base font-semibold text-[var(--color-text)]">{t('student:studyBackgroundTitle', 'Tell us about your current education')}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{t('student:studyBackgroundHint', 'Add the basics so we understand your academic background.')}</p>
                    </div>
                  </div>

                  {(educationStatus === 'in_school' || educationStatus === 'finished_school') && (
                    <div className="space-y-3">
                      <Input label={t('schoolName')} {...register('schoolName')} placeholder="Lyceum No.1" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('gradeLevel')} error={errors.gradeLevel?.message} {...register('gradeLevel')} placeholder={t('gradePlaceholder')} />
                        <Input label={t('graduationYear')} type="number" min={1950} max={2030} {...register('graduationYear')} placeholder="2026" />
                      </div>
                      <Input label={t('gpa')} type="number" step="0.01" min={0} max={4} error={errors.gpa?.message} {...register('gpa')} placeholder="0-4" />
                    </div>
                  )}

                  {(educationStatus === 'in_university' || educationStatus === 'finished_university') && (
                    <div className="space-y-3">
                      <Input label={t('institutionName')} {...register('schoolName')} placeholder="TashGU" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('gradeLevel')} {...register('gradeLevel')} placeholder="1 course, 2 course..." />
                        <Input label={t('graduationYear')} type="number" min={1950} max={2030} {...register('graduationYear')} placeholder="2027" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 p-3 mt-4 rounded-xl border border-[var(--color-primary-accent)]/30 bg-[var(--color-primary-accent)]/5">
                    <span className="text-sm text-[var(--color-text)]">{t('linkToSchoolHint')}</span>
                    <Link to="/student/schools" className="shrink-0 inline-flex items-center gap-1.5 text-sm text-[var(--color-primary-accent)] font-medium hover:underline">
                      {t('chooseSchool')} <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              )}

              {educationStepOneDone && needsDegreeGoal && (
                <Card className="mb-5 p-5 border border-[var(--color-border)]">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-accent)] text-sm font-semibold text-white">3</div>
                    <div>
                      <p className="text-base font-semibold text-[var(--color-text)]">{t('student:degreeGoalTitle', 'Applying for degree')}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{t('student:degreeGoalHint', 'Choose which degree you want to apply for next.')}</p>
                    </div>
                  </div>
                  <Select label={t('applyingForDegree')} options={targetDegreeOptions} placeholder="-" {...register('targetDegreeLevel')} className="text-base" />
                </Card>
              )}

              {educationStepOneDone && (
                <Card className="mb-6 p-5 border border-[var(--color-border)]">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-accent)] text-sm font-semibold text-white">
                      {needsDegreeGoal ? 4 : 3}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[var(--color-text)]">{t('languageLevel')}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{t('student:languageLevelHint', 'Add the languages you can study in. This helps us match you correctly.')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
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
                    <Card className="p-3 border border-dashed border-[var(--color-border)] bg-[var(--color-bg)]">
                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="min-w-[100px]">
                          <Select
                            value={newLanguage}
                            onChange={(e) => {
                              setNewLanguage(e.target.value)
                              if (e.target.value !== 'Other') setCustomLanguageName('')
                            }}
                            options={languageOptions}
                            aria-label="Language"
                            className="rounded-xl bg-[var(--color-card)]"
                          />
                        </div>
                        {newLanguage === 'Other' && (
                          <div className="min-w-[120px]">
                            <input
                              type="text"
                              value={customLanguageName}
                              onChange={(e) => setCustomLanguageName(e.target.value)}
                              placeholder="Language"
                              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                            />
                          </div>
                        )}
                        <div className="min-w-[80px]">
                          <Select
                            value={newLevel}
                            onChange={(e) => setNewLevel(e.target.value)}
                            options={levelOptions}
                            aria-label="Level"
                            className="rounded-xl bg-[var(--color-card)]"
                          />
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
                          {t('addLanguage')}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </Card>
              )}

              <button
                type="button"
                onClick={() => setEducationShowAdvanced(!educationShowAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] py-2"
              >
                {educationShowAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {t('educationMoreOptions')}
              </button>
              {educationShowAdvanced && (
                <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label={t('gradingScheme')} options={gradingSchemeOptions} placeholder="—" {...register('gradingScheme')} />
                    <Select label={t('gradeScaleOutOf')} options={gradeScaleOptions} placeholder="—" {...register('gradeScale')} />
                  </div>
                  <Select label={t('highestLevelOfEducation')} options={highestEducationOptions} placeholder="—" {...register('highestEducationLevel')} />
                  <Checkbox
                    {...register('schoolCompleted')}
                    label={t('schoolCompleted')}
                  />
                  <p className="text-sm font-medium text-[var(--color-text)]">{t('schoolsUniversitiesAttended')}</p>
                  <div className="space-y-3">
                {schoolsAttendedFields.map((field, i) => (
                  <Card key={field.id} className="p-4 space-y-2 border border-[var(--color-border)]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('entryNumber', { n: i + 1 })}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSchool(i)} aria-label="Remove"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <Select label={t('institutionTypeLabel')} options={institutionTypeOptions} placeholder="—" {...register(`schoolsAttended.${i}.institutionType`)} />
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
                </div>
              )}
            </>
          )}

          {openSection === 'about' && (
            <>
              <Textarea
                label={t('bio')}
                placeholder={t('bioPlaceholder')}
                rows={4}
                {...register('bio')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('student:budgetAmount', 'Budget for studies')}</label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    placeholder={t('student:budgetPlaceholder', 'e.g. 10000')}
                    {...register('budgetAmount', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Select label={t('student:budgetCurrency', 'Currency')} options={currencyOptions} {...register('budgetCurrency')} />
                </div>
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
                <p className="text-[var(--color-text-muted)]">Loading options...</p>
              ) : (
                <div className="rounded-input border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <p className="text-sm font-medium text-[var(--color-text)]">{t('skillsPlaceholder')}</p>
                  <ChipSelect
                    options={criteria.skills}
                    value={watch('skills') ?? []}
                    onChange={(v) => setValue('skills', v, { shouldDirty: true })}
                    max={50}
                    placeholder={t('skillsPlaceholder')}
                    className="mt-3"
                  />
                </div>
              )}
            </>
          )}

          {openSection === 'faculties' && (
            <>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                {t('student:interestedFacultiesHint', 'Choose faculties you are interested in. You can open each faculty to see what it includes.')}
              </p>
              <div className="grid items-start gap-3 sm:grid-cols-2">
                {FIELD_OF_STUDY.map((cat) => {
                  const selected = (watch('interestedFaculties') ?? []).includes(cat.id)
                  const open = openFacultyId === cat.id
                  return (
                    <div
                      key={cat.id}
                      className={`self-start rounded-card border-2 bg-[var(--color-card)] shadow-[var(--shadow-card)] transition-all ${
                        selected ? 'border-primary-accent ring-1 ring-primary-accent/20' : 'border-[var(--color-border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 p-3">
                        <Checkbox
                          checked={selected}
                          onChange={(e) => {
                            const current = watch('interestedFaculties') ?? []
                            const next = e.target.checked
                              ? Array.from(new Set([...current, cat.id])).slice(0, 10)
                              : current.filter((x) => x !== cat.id)
                            setValue('interestedFaculties', next, { shouldDirty: true })
                          }}
                          label={
                            <FacultyMarqueeLabel text={t(cat.titleKey)} />
                          }
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
                          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{t('common:includes', 'Includes')}</p>
                          <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
                            {cat.items.map((it) => (
                              <li key={it} className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] shrink-0" />
                                {it}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {openSection === 'experience' && (
            <>
              <div className="space-y-4">
                {experienceFields.map((field, i) => (
                  <Card key={field.id} className="p-4 space-y-3 border border-[var(--color-border)]">
                    <div className="flex justify-between items-center">
                      <Select options={experienceTypeOptions} {...register(`experiences.${i}.type`)} className="min-w-[180px]" />
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
                    <Textarea
                      label={t('description')}
                      placeholder={t('description')}
                      rows={3}
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
                    <Textarea
                      label={t('workDescription')}
                      placeholder={t('workDescription')}
                      rows={2}
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
