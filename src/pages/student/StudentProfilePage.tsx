import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FileUpload } from '@/components/ui/FileUpload'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getStudentProfile as getOwnStudentProfile, updateStudentProfile as updateOwnStudentProfile, type StudentProfileData, type StudentExperience, type StudentPortfolioWork } from '@/services/student'
import { getUniversityHubCountries } from '@/services/options'
import { getMyDocuments, type StudentDocumentItem } from '@/services/studentDocuments'
import {
  getStudentProfile as getCounsellorStudentProfile,
  getStudentDocuments as getCounsellorStudentDocuments,
  addStudentDocument,
  deleteStudentDocument,
  updateMyStudent,
  type CounsellorStudentDocument,
} from '@/services/counsellor'
import {
  getStudentProfileByUser,
  updateStudentProfileByUser,
  getStudentDocumentsByUser,
  addStudentDocumentByUser,
  deleteStudentDocumentByUser,
} from '@/services/admin'
import { getProfileCriteria } from '@/services/options'
import { getApiError } from '@/services/auth'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, User, MapPin, GraduationCap, FileText, Sparkles, Briefcase, FolderOpen, BookOpen, ChevronDown, ChevronRight, Check, Circle, ExternalLink, Lock, FileStack, DollarSign, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { getStudentAvatarUrl } from '@/services/upload'
import { PageTitle } from '@/components/ui/PageTitle'
import { notifySuccess } from '@/utils/notify'
import { dedupeNormalizedCountries, mergeCountryOptionLabels, normalizeCountryLabel } from '@/utils/countryLabels'

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
  budgetAmount: z.preprocess((v) => {
    if (v === '' || v == null) return undefined
    if (typeof v === 'number' && Number.isNaN(v)) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }, z.number().min(0).optional()),
  budgetCurrency: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function mergeProfileWithDraft(base: FormData, storageKey: string | null): FormData {
  if (!storageKey) return base
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return base
    const draft = JSON.parse(raw) as Partial<FormData>
    return { ...base, ...draft }
  } catch {
    return base
  }
}

type SectionId = 'personal' | 'location' | 'education' | 'about' | 'budget' | 'skills' | 'faculties' | 'experience' | 'works' | 'documents'
type ProfileFocusField = 'firstName' | 'lastName' | 'city' | 'schoolName' | 'gradeLevel' | 'graduationYear'

const SECTIONS: { id: SectionId; titleKey: string; icon: LucideIcon }[] = [
  { id: 'personal', titleKey: 'stepPersonal', icon: User },
  { id: 'faculties', titleKey: 'stepFaculties', icon: BookOpen },
  { id: 'location', titleKey: 'stepLocation', icon: MapPin },
  { id: 'budget', titleKey: 'student:budgetAmount', icon: DollarSign },
  { id: 'documents', titleKey: 'common:documents', icon: FileStack },
  { id: 'education', titleKey: 'stepEducation', icon: GraduationCap },
  { id: 'about', titleKey: 'stepAbout', icon: FileText },
  { id: 'skills', titleKey: 'stepSkills', icon: Sparkles },
  { id: 'experience', titleKey: 'stepExperience', icon: Briefcase },
  { id: 'works', titleKey: 'stepWorks', icon: FolderOpen },
]

const SECTION_TITLE_FALLBACKS: Record<'en' | 'ru' | 'uz', Partial<Record<SectionId, string>>> = {
  en: {
    personal: 'Personal details',
    location: 'Location',
    education: 'Education',
    budget: 'Budget for studies',
    documents: 'Documents',
    about: 'About me',
    skills: 'Skills',
    faculties: 'Faculties of interest',
    experience: 'Work experience',
    works: 'Portfolio and extracurriculars',
  },
  ru: {
    personal: 'Личные данные',
    location: 'Местоположение',
    education: 'Образование',
    documents: 'Документы',
    about: 'О себе',
    skills: 'Навыки',
    faculties: 'Факультеты / направления',
    experience: 'Опыт и активность',
    works: 'Портфолио и внеклассная активность',
  },
  uz: {
    personal: "Shaxsiy ma'lumotlar",
    location: 'Manzil',
    education: "Ta'lim",
    documents: 'Hujjatlar',
    about: "O'zim haqimda",
    skills: "Ko'nikmalar",
    faculties: "Fanlar / yo'nalishlar",
    experience: 'Ish tajribasi',
    works: 'Portfolio va extracurricularlar',
  },
}

const PROFILE_SECTION_QUERY_PARAM = 'profileSection'

function isSectionId(value: string | null): value is SectionId {
  if (!value) return false
  return SECTIONS.some((section) => section.id === value)
}

function readSectionFromSearch(search: string): SectionId | null {
  const params = new URLSearchParams(search)
  const raw = params.get(PROFILE_SECTION_QUERY_PARAM)
  return isSectionId(raw) ? raw : null
}

function buildProfileSectionUrl(section: SectionId | null): string {
  const url = new URL(window.location.href)
  if (section) {
    url.searchParams.set(PROFILE_SECTION_QUERY_PARAM, section)
  } else {
    url.searchParams.delete(PROFILE_SECTION_QUERY_PARAM)
  }
  return `${url.pathname}${url.search}${url.hash}`
}

function normalizeBrokenTranslation(value: string, fallback: string): string {
  const trimmed = value.trim()
  if (!trimmed) return fallback
  const compact = trimmed.replace(/\s+/g, '')
  if (!compact) return fallback
  const brokenChars = [...compact].filter((ch) => ch === '?' || ch === '�').length
  if (brokenChars / compact.length >= 0.35) return fallback
  return trimmed
}

const COUNSELLOR_DOC_TYPES = [
  { value: 'transcript', label: 'Transcript' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'language_certificate', label: 'Language certificate' },
  { value: 'course_certificate', label: 'Course certificate' },
  { value: 'passport', label: 'Passport' },
  { value: 'id_card', label: 'ID card' },
  { value: 'other', label: 'Other' },
]

const COUNSELLOR_LANGUAGE_CERT_TYPES = [
  { value: 'IELTS', label: 'IELTS' },
  { value: 'TOEFL', label: 'TOEFL' },
  { value: 'Cambridge', label: 'Cambridge' },
  { value: 'Duolingo', label: 'Duolingo' },
  { value: 'other', label: 'Other' },
]

function finiteBudgetAmount(n: unknown): number | undefined {
  if (n == null) return undefined
  if (typeof n === 'number' && Number.isNaN(n)) return undefined
  const x = Number(n)
  return Number.isFinite(x) ? x : undefined
}

/** Treat /api/uploads/… and full URL to same file as equal (dirty / Save). */
function normalizeAvatarUrlForDirtyCheck(u: string | undefined | null): string {
  const s = String(u ?? '').trim()
  if (!s) return ''
  try {
    if (s.startsWith('http://') || s.startsWith('https://')) {
      const url = new URL(s)
      const path = url.pathname
      return path.startsWith('/api') ? path.slice(4) : path
    }
  } catch {
    /* ignore */
  }
  return s.startsWith('/api') ? s.slice(4) : s
}

function aboutSectionMatchesProfile(
  values: { bio?: string; avatarUrl?: string },
  profile: StudentProfileData
): boolean {
  if (String(values.bio ?? '').trim() !== String(profile.bio ?? '').trim()) return false
  return normalizeAvatarUrlForDirtyCheck(values.avatarUrl) === normalizeAvatarUrlForDirtyCheck(profile.avatarUrl)
}

function budgetSectionMatchesProfile(
  values: { budgetAmount?: unknown; budgetCurrency?: string },
  profile: StudentProfileData
): boolean {
  if (finiteBudgetAmount(values.budgetAmount) !== finiteBudgetAmount(profile.budgetAmount)) return false
  const vc = String(values.budgetCurrency ?? 'USD').trim()
  const pc = String(profile.budgetCurrency ?? 'USD').trim()
  return vc === pc
}

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
      const schools = profile.schoolsAttended ?? []
      const hasSchoolDetail = schools.some(
        (s) =>
          (s.institutionName != null && String(s.institutionName).trim() !== '') ||
          (s.country != null && String(s.country).trim() !== '') ||
          (s.educationLevel != null && String(s.educationLevel).trim() !== '') ||
          (s.degreeName != null && String(s.degreeName).trim() !== '')
      )
      const status = profile.educationStatus != null ? String(profile.educationStatus).trim() : ''
      const needsTargetDegree = status === 'in_university' || status === 'finished_university'
      const gpaNum = Number(profile.gpa)
      const hasGradeOrGpa =
        (profile.gradeLevel != null && String(profile.gradeLevel).trim() !== '') ||
        Number.isFinite(gpaNum) ||
        schools.some((s) => s.educationLevel != null && String(s.educationLevel).trim() !== '')
      const hasLanguage =
        (Array.isArray(profile.languages) && profile.languages.length > 0) ||
        (profile.languageLevel != null && String(profile.languageLevel).trim() !== '')
      const hasSchool =
        (profile.schoolName != null && String(profile.schoolName).trim() !== '') || hasSchoolDetail
      const hasTargetDegree = profile.targetDegreeLevel != null && String(profile.targetDegreeLevel).trim() !== ''
      const checks = [
        status !== '',
        needsTargetDegree ? hasTargetDegree : status !== '',
        hasGradeOrGpa,
        hasLanguage,
        hasSchool,
      ]
      return Math.round((checks.filter(Boolean).length / 5) * 100)
    }
    case 'about': {
      const bio = profile.bio != null && String(profile.bio).trim() !== ''
      const avatar = profile.avatarUrl != null && String(profile.avatarUrl).trim() !== ''
      return Math.round(([bio, avatar].filter(Boolean).length / 2) * 100)
    }
    case 'budget': {
      const budget =
        profile.budgetAmount != null &&
        Number.isFinite(Number(profile.budgetAmount)) &&
        Number(profile.budgetAmount) >= 0
      return budget ? 100 : 0
    }
    case 'skills': {
      const hasItems = (arr: unknown) =>
        Array.isArray(arr) && arr.some((x) => x != null && String(x).trim() !== '')
      const n = [hasItems(profile.skills), hasItems(profile.interests), hasItems(profile.hobbies)].filter(Boolean).length
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
    { label: t('student:minProfileName', 'Name'), done: hasName, section: 'personal' as const },
    { label: t('student:minProfileLocation', 'Location'), done: hasLocation, section: 'location' as const },
    { label: t('student:minProfileEducation', 'Education'), done: hasEducation, section: 'education' as const },
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

const COUNTRY_FALLBACK_LABELS = COUNTRY_CODE_OPTIONS.map((item) => item.label)

type StudentProfilePageProps = {
  studentUserId?: string
  counsellorMode?: boolean
  /** Admin editing any student — same UI as school counsellor. */
  adminMode?: boolean
}

export function StudentProfilePage({ studentUserId, counsellorMode = false, adminMode = false }: StudentProfilePageProps = {}) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('student', { useSuspense: false })
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
  const [openSkillsPanel, setOpenSkillsPanel] = useState<'skills' | 'interests' | 'hobbies'>('skills')
  const [displayPercent, setDisplayPercent] = useState(0)
  const [educationShowAdvanced, setEducationShowAdvanced] = useState(false)
  const [educationWizardStep, setEducationWizardStep] = useState(1)
  /** Distinct countries where the platform has ≥1 university (catalog or verified profile). Preferred study chips only. */
  const [countriesWithUniversities, setCountriesWithUniversities] = useState<string[]>([])
  const [languageCertificates, setLanguageCertificates] = useState<StudentDocumentItem[]>([])
  const [documents, setDocuments] = useState<CounsellorStudentDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [docAdding, setDocAdding] = useState(false)
  const [docType, setDocType] = useState<string>('transcript')
  const [docName, setDocName] = useState('')
  const [docCertificateType, setDocCertificateType] = useState('IELTS')
  const [docScore, setDocScore] = useState('')
  const [docFileUrl, setDocFileUrl] = useState('')
  const [previewDocument, setPreviewDocument] = useState<CounsellorStudentDocument | null>(null)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [autoFocusField, setAutoFocusField] = useState<ProfileFocusField | null>(null)
  const requestedEducationStepRef = useRef<number | null>(null)
  /** School counsellor: visibility is edited here (students use /profile → Account). */
  const [counsellorVisibility, setCounsellorVisibility] = useState<'private' | 'public'>('private')
  const isExternalStudent = Boolean(studentUserId && (counsellorMode || adminMode))
  const isCounsellorStudent = Boolean(counsellorMode && studentUserId)
  const isAdminStudent = Boolean(adminMode && studentUserId)

  const profileDraftStorageKey = useMemo(() => {
    if (adminMode && studentUserId) return `admin-student-profile-draft:${studentUserId}`
    if (counsellorMode && studentUserId) return `counsellor-student-profile-draft:${studentUserId}`
    return user?.id ? `student-profile-draft:${user.id}` : null
  }, [adminMode, counsellorMode, studentUserId, user?.id])

  const { register, reset, control, watch, setValue, getValues, setFocus, formState: { errors, isDirty } } = useForm<FormData>({
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
  const headerAvatarInputRef = useRef<HTMLInputElement>(null)
  const aboutBioWatch = watch('bio')
  const budgetAmountWatch = watch('budgetAmount')
  const budgetCurrencyWatch = watch('budgetCurrency')
  const educationStatus = watch('educationStatus')
  const targetDegreeLevel = watch('targetDegreeLevel')
  const educationStepOneDone = Boolean(educationStatus)
  const educationStepTwoDone = Boolean(
    educationStatus &&
    hasFilledValue(watch('schoolName')) &&
    hasFilledValue(watch('gradeLevel')) &&
    watch('graduationYear') != null
  )
  const needsDegreeGoal = educationStatus === 'in_university' || educationStatus === 'finished_university'
  const educationStepThreeDone = needsDegreeGoal ? Boolean(targetDegreeLevel) : true
  const educationStepFourDone = (watch('languages')?.length ?? 0) > 0 || hasFilledValue(watch('languageLevel'))
  const educationVisibleSteps = needsDegreeGoal ? 4 : 3
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
  const displayedSections = SECTIONS
  const getSectionTitle = (section: { id: SectionId; titleKey: string }) => {
    const langCode = (i18n.resolvedLanguage ?? i18n.language ?? 'en').slice(0, 2) as 'en' | 'ru' | 'uz'
    const langPack = SECTION_TITLE_FALLBACKS[langCode] ?? SECTION_TITLE_FALLBACKS.en
    const fallback = langPack[section.id] ?? SECTION_TITLE_FALLBACKS.en[section.id] ?? section.id
    return normalizeBrokenTranslation(t(section.titleKey, fallback), fallback)
  }
  const visibleSectionIds = useMemo(() => new Set(displayedSections.map((section) => section.id)), [displayedSections])
  const openSectionWithHistory = (section: SectionId, options?: { focusField?: ProfileFocusField; educationStep?: number }) => {
    requestedEducationStepRef.current = section === 'education' ? options?.educationStep ?? null : null
    setAutoFocusField(options?.focusField ?? null)
    if (typeof window !== 'undefined') {
      const nextUrl = buildProfileSectionUrl(section)
      navigate(nextUrl)
    }
    setOpenSection(section)
  }
  const getFocusOptionsForSection = (section: SectionId): { focusField?: ProfileFocusField; educationStep?: number } => {
    const values = getValues()
    if (section === 'personal') {
      return { focusField: hasFilledValue(values.firstName) && !hasFilledValue(values.lastName) ? 'lastName' : 'firstName' }
    }
    if (section === 'location') {
      return { focusField: 'city' }
    }
    if (section === 'education') {
      if (!values.educationStatus) return { educationStep: 1 }
      if (!hasFilledValue(values.schoolName)) return { educationStep: 2, focusField: 'schoolName' }
      if (!hasFilledValue(values.gradeLevel)) return { educationStep: 2, focusField: 'gradeLevel' }
      if (values.graduationYear == null || String(values.graduationYear).trim() === '') {
        return { educationStep: 2, focusField: 'graduationYear' }
      }
      return { educationStep: 2, focusField: 'schoolName' }
    }
    return {}
  }
  const openEditableSection = (section: SectionId, options?: { focusField?: ProfileFocusField; educationStep?: number }) => {
    if (profile) reset(mapProfileToFormData(profile))
    openSectionWithHistory(section, options ?? getFocusOptionsForSection(section))
  }
  const closeSectionWithHistory = () => {
    if (typeof window !== 'undefined') {
      const currentSection = readSectionFromSearch(window.location.search)
      if (currentSection) {
        window.history.back()
        return
      }
    }
    setOpenSection(null)
  }
  const residenceCountrySource = useMemo(
    () => mergeCountryOptionLabels(COUNTRY_FALLBACK_LABELS, countriesWithUniversities),
    [countriesWithUniversities]
  )

  const countrySelectOptions = useMemo(() => {
    const set = new Map<string, string>()
    for (const x of residenceCountrySource) {
      const n = normalizeCountryLabel(x)
      if (n) set.set(n.toLowerCase(), n)
    }
    const current = normalizeCountryLabel(watch('country'))
    if (current) set.set(current.toLowerCase(), current)
    return [...set.values()].sort((a, b) => a.localeCompare(b, 'en')).map((v) => ({ value: v, label: v }))
  }, [residenceCountrySource, watch('country')])

  const schoolsAttendedForCountryOptions = watch('schoolsAttended')
  const schoolCountrySelectOptions = useMemo(() => {
    const set = new Map<string, string>()
    for (const x of residenceCountrySource) {
      const n = normalizeCountryLabel(x)
      if (n) set.set(n.toLowerCase(), n)
    }
    for (const row of schoolsAttendedForCountryOptions ?? []) {
      const n = normalizeCountryLabel(row?.country)
      if (n) set.set(n.toLowerCase(), n)
    }
    const opts = [...set.values()].sort((a, b) => a.localeCompare(b, 'en')).map((v) => ({ value: v, label: v }))
    return [{ value: '', label: '—' }, ...opts]
  }, [residenceCountrySource, schoolsAttendedForCountryOptions])

  const preferredCountriesWatch = watch('preferredCountries')
  const chipCountryOptions = useMemo(() => [...countriesWithUniversities], [countriesWithUniversities])
  const attendedInstitutionTypeOptions = educationStatus === 'in_school'
    ? [{ value: 'school', label: t('institutionTypeSchool') }]
    : institutionTypeOptions
  const canGoNextEducationStep = educationWizardStep === 1
    ? educationStepOneDone
    : educationWizardStep === 2
      ? educationStepTwoDone
      : educationWizardStep === 3 && needsDegreeGoal
        ? educationStepThreeDone
        : educationStepFourDone

  useEffect(() => {
    getProfileCriteria().then(setCriteria).catch(() => setCriteria({ skills: [], interests: [], hobbies: [] }))
  }, [])

  useEffect(() => {
    if (openSection === 'education') {
      setEducationWizardStep(requestedEducationStepRef.current ?? 1)
      requestedEducationStepRef.current = null
    } else {
      requestedEducationStepRef.current = null
    }
  }, [openSection])

  useEffect(() => {
    if (!openSection || !autoFocusField) return
    const timer = window.setTimeout(() => {
      try {
        setFocus(autoFocusField)
      } catch {
        // The field may be hidden on the current wizard step.
      }
      const node = document.querySelector<HTMLInputElement>(`input[name="${autoFocusField}"]`)
      if (node) {
        node.focus({ preventScroll: true })
        const valueLength = node.value.length
        try {
          node.setSelectionRange(valueLength, valueLength)
        } catch {
          // Some input types do not support selection ranges.
        }
      }
      setAutoFocusField(null)
    }, 120)
    return () => window.clearTimeout(timer)
  }, [autoFocusField, educationWizardStep, openSection, setFocus])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncSectionFromUrl = () => {
      const sectionFromUrl = readSectionFromSearch(window.location.search)
      if (sectionFromUrl && !visibleSectionIds.has(sectionFromUrl)) {
        const cleanUrl = buildProfileSectionUrl(null)
        window.history.replaceState(window.history.state, '', cleanUrl)
        setOpenSection(null)
        return
      }
      setOpenSection(sectionFromUrl)
    }

    syncSectionFromUrl()
    window.addEventListener('popstate', syncSectionFromUrl)
    return () => window.removeEventListener('popstate', syncSectionFromUrl)
  }, [visibleSectionIds])

  useEffect(() => {
    if (!needsDegreeGoal && educationWizardStep > 3) {
      setEducationWizardStep(3)
    }
  }, [needsDegreeGoal, educationWizardStep])

  const loadManagedStudentDocuments = useCallback(async () => {
    if (!isExternalStudent || !studentUserId) return
    setDocumentsLoading(true)
    try {
      const docs = isAdminStudent
        ? (await getStudentDocumentsByUser(studentUserId!)) as unknown as CounsellorStudentDocument[]
        : await getCounsellorStudentDocuments(studentUserId!)
      setDocuments(docs)
      setLanguageCertificates(
        docs
          .filter((doc) => doc.type === 'language_certificate')
          .map((doc) => ({ ...doc, status: doc.status ?? 'approved' }) as StudentDocumentItem)
      )
    } catch {
      setDocuments([])
      setLanguageCertificates([])
    } finally {
      setDocumentsLoading(false)
    }
  }, [isAdminStudent, isExternalStudent, studentUserId])

  useEffect(() => {
    if (educationStatus !== 'in_school') return
    setValue('schoolCompleted', false, { shouldDirty: false })
    const current = getValues('schoolsAttended') ?? []
    if (current.length === 0) return
    const normalized = current.map((entry) => ({ ...entry, institutionType: 'school' as const }))
    setValue('schoolsAttended', normalized, { shouldDirty: false })
  }, [educationStatus, getValues, setValue])

  useEffect(() => {
    let cancelled = false
    getUniversityHubCountries()
      .then((countries) => {
        if (!cancelled) setCountriesWithUniversities(mergeCountryOptionLabels([], countries))
      })
      .catch(() => {
        if (!cancelled) setCountriesWithUniversities([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (countriesWithUniversities.length === 0) return
    const allowed = new Set(countriesWithUniversities.map((c) => normalizeCountryLabel(c).toLowerCase()))
    const prefs = preferredCountriesWatch ?? []
    const normalizedPrefs = dedupeNormalizedCountries(prefs)
    const next = normalizedPrefs.filter((p) => allowed.has(normalizeCountryLabel(p).toLowerCase()))
    const prefKey = normalizedPrefs.map((p) => normalizeCountryLabel(p).toLowerCase()).sort().join('|')
    const nextKey = next.map((p) => normalizeCountryLabel(p).toLowerCase()).sort().join('|')
    if (prefKey === nextKey) return
    setValue('preferredCountries', next, { shouldDirty: true })
  }, [countriesWithUniversities, preferredCountriesWatch, setValue])

  useEffect(() => {
    if (openSection !== 'education') return
    if (isExternalStudent && studentUserId) {
      void loadManagedStudentDocuments()
      return
    }
    getMyDocuments()
      .then((docs) => {
        setLanguageCertificates(docs.filter((doc) => doc.type === 'language_certificate'))
      })
      .catch(() => setLanguageCertificates([]))
  }, [openSection, isExternalStudent, studentUserId, loadManagedStudentDocuments])

  useEffect(() => {
    if (openSection !== 'documents' || !isExternalStudent || !studentUserId) return
    void loadManagedStudentDocuments()
  }, [openSection, isExternalStudent, studentUserId, loadManagedStudentDocuments])

  useEffect(() => {
    const target = profile?.portfolioCompletionPercent ?? 0
    const t = setTimeout(() => setDisplayPercent(target), 80)
    return () => clearTimeout(t)
  }, [profile?.portfolioCompletionPercent])

  useEffect(() => {
    const load = async () => {
      try {
        const data = isAdminStudent
          ? (await getStudentProfileByUser(studentUserId!)) as StudentProfileData
          : isCounsellorStudent
            ? await (getCounsellorStudentProfile(studentUserId!) as Promise<StudentProfileData>)
            : await getOwnStudentProfile()
        setProfile(data)
        const initialValues = mapProfileToFormData(data)
        reset(mergeProfileWithDraft(initialValues, profileDraftStorageKey))
      } catch (e) {
        setError(getApiError(e).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profileDraftStorageKey, reset, isAdminStudent, isCounsellorStudent, studentUserId])

  useEffect(() => {
    if (!profile) return
    setCounsellorVisibility(profile.profileVisibility === 'public' ? 'public' : 'private')
  }, [profile?.id, profile?.profileVisibility])

  useEffect(() => {
    if (!profileDraftStorageKey) return
    const subscription = watch((values) => {
      if (!isDirty) return
      try {
        localStorage.setItem(profileDraftStorageKey, JSON.stringify(values))
      } catch {
        // ignore storage errors
      }
    })
    return () => subscription.unsubscribe()
  }, [isDirty, profileDraftStorageKey, watch])

  /**
   * About me: do not use RHF isDirty alone — empty number inputs often become NaN vs undefined from API and look "dirty".
   * Compare only bio, avatar (normalized URL), budget amount/currency to the loaded profile.
   */
  const hasUnsavedChanges = Boolean(
    openSection &&
      (openSection === 'about' && profile
        ? !aboutSectionMatchesProfile(
            {
              bio: aboutBioWatch,
              avatarUrl,
            },
            profile
          )
        : openSection === 'budget' && profile
          ? !budgetSectionMatchesProfile(
              {
                budgetAmount: budgetAmountWatch,
                budgetCurrency: budgetCurrencyWatch,
              },
              profile
            )
          : isDirty)
  )

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges])

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
      country: normalizeCountryLabel(data.country) || '',
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
        country: normalizeCountryLabel(s.country) || '',
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
      preferredCountries: dedupeNormalizedCountries(data.preferredCountries ?? []),
      budgetAmount: finiteBudgetAmount(data.budgetAmount),
      budgetCurrency: data.budgetCurrency ?? 'USD',
    }
  }

  function buildPayload(data: FormData) {
    const base = {
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      birthDate: data.birthDate || undefined,
      country: normalizeCountryLabel(data.country) || undefined,
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
        country: normalizeCountryLabel(s.country) || undefined,
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
      /** Always send string (possibly empty) so clearing the photo persists; omitting the key leaves the old URL. */
      avatarUrl:
        data.avatarUrl != null && String(data.avatarUrl).trim() !== ''
          ? String(data.avatarUrl).trim()
          : '',
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
      preferredCountries: dedupeNormalizedCountries(data.preferredCountries ?? []),
      budgetAmount:
        data.budgetAmount != null && Number.isFinite(Number(data.budgetAmount))
          ? Number(data.budgetAmount)
          : undefined,
      budgetCurrency: data.budgetCurrency || undefined,
    }
    if (isExternalStudent) {
      return { ...base, profileVisibility: counsellorVisibility }
    }
    return base
  }

  async function persistCurrentProfile(data: FormData) {
    if (isAdminStudent) {
      await updateStudentProfileByUser(studentUserId!, buildPayload(data))
    } else if (isCounsellorStudent) {
      await updateMyStudent(studentUserId!, buildPayload(data))
    } else {
      await updateOwnStudentProfile(buildPayload(data))
    }
    const fullProfile = isAdminStudent
      ? (await getStudentProfileByUser(studentUserId!)) as StudentProfileData
      : isCounsellorStudent
        ? await (getCounsellorStudentProfile(studentUserId!) as Promise<StudentProfileData>)
        : await getOwnStudentProfile()
    setProfile(fullProfile)
    reset(mapProfileToFormData(fullProfile))
    if (profileDraftStorageKey) {
      try {
        localStorage.removeItem(profileDraftStorageKey)
      } catch {
        // ignore storage errors
      }
    }
  }

  async function onAvatarFileUrlChange(url: string) {
    if ((watch('avatarUrl') ?? '') === url) return
    setValue('avatarUrl', url, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    if (openSection === 'about') return
    setError('')
    setSaving(true)
    try {
      await persistCurrentProfile(getValues())
      notifySuccess(t('common:saved', 'Saved'))
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
      await persistCurrentProfile(getValues())
      closeSectionWithHistory()
      notifySuccess(t('common:saved', 'Saved'))
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const verified = isExternalStudent ? null : user?.studentProfile?.verifiedAt
  const minimalChecklist = getMinimalChecklist(profile, t)
  const minimalChecklistDone = minimalChecklist.filter((item) => item.done).length
  const handleAddManagedStudentDocument = async () => {
    if (!isExternalStudent || !studentUserId || !docFileUrl.trim()) return
    setDocAdding(true)
    try {
      const payload = {
        type: docType,
        fileUrl: docFileUrl.trim(),
        name: docName.trim() || undefined,
        certificateType: docType === 'language_certificate' ? docCertificateType : undefined,
        score: docType === 'language_certificate' ? docScore.trim() || undefined : undefined,
      }
      if (isAdminStudent) {
        await addStudentDocumentByUser(studentUserId!, payload)
      } else {
        await addStudentDocument(studentUserId!, payload)
      }
      setDocName('')
      setDocScore('')
      setDocFileUrl('')
      await loadManagedStudentDocuments()
    } catch (e) {
      setError(getApiError(e).message)
    } finally {
      setDocAdding(false)
    }
  }

  const handleDeleteManagedStudentDocument = async (docId: string) => {
    if (!isExternalStudent || !studentUserId) return
    try {
      if (isAdminStudent) {
        await deleteStudentDocumentByUser(studentUserId!, docId)
      } else {
        await deleteStudentDocument(studentUserId!, docId)
      }
      await loadManagedStudentDocuments()
    } catch (e) {
      setError(getApiError(e).message)
    }
  }

  const forceCloseSection = () => {
    if (profile) reset(mapProfileToFormData(profile))
    closeSectionWithHistory()
  }
  const closeSection = () => {
    if (hasUnsavedChanges && !saving) {
      setShowUnsavedModal(true)
      return
    }
    forceCloseSection()
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
    <div className="w-full space-y-5 min-h-0 pb-page-bottom-cta">
      <PageTitle title={t('portfolioTitle')} icon="User" />
      <div className="flex flex-wrap items-center gap-4" data-onboarding="student-profile-overview">
        <FileUpload
          headless
          variant="avatar"
          value={avatarUrl}
          onChange={onAvatarFileUrlChange}
          inputRef={headerAvatarInputRef}
          label={t('student:changeAvatar', 'Change profile photo')}
        />
        <button
          type="button"
          className="block shrink-0 cursor-pointer rounded-full transition-[box-shadow,transform] hover:scale-[1.02] hover:ring-2 hover:ring-primary-accent/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-50 disabled:pointer-events-none"
          aria-label={t('student:changeAvatar', 'Change profile photo')}
          title={t('student:changeAvatar', 'Change profile photo')}
          disabled={saving}
          onClick={() => headerAvatarInputRef.current?.click()}
        >
          <img
            src={getStudentAvatarUrl(avatarUrl)}
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[var(--color-border)] bg-[var(--color-border)]"
          />
        </button>
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

      {profile?.minimalPortfolioComplete === false && (
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
              <button
                key={item.label}
                type="button"
                onClick={() => openEditableSection(item.section)}
                className="flex min-h-[46px] items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-3 text-left transition-colors hover:border-[var(--color-primary-accent)] hover:bg-[var(--color-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
              >
                {item.done ? (
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                )}
                <span className={cn('text-sm', item.done ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]')}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isExternalStudent && profile && studentUserId && (
        <Card className="p-4 sm:p-5 border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" aria-hidden />
            <p className="text-base font-semibold text-[var(--color-text)]">{t('profileVisibilityTitle')}</p>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">{t('profileVisibilityHint')}</p>
          <div className="space-y-3">
            <label className="flex gap-3 items-start cursor-pointer rounded-card border border-[var(--color-border)] p-3 has-[:checked]:border-primary-accent/50 has-[:checked]:bg-primary-accent/5">
              <input
                type="radio"
                name="external-profile-visibility"
                value="private"
                className="mt-1"
                checked={counsellorVisibility === 'private'}
                onChange={() => {
                  if (counsellorVisibility === 'private') return
                  setCounsellorVisibility('private')
                  const req = isAdminStudent
                    ? updateStudentProfileByUser(studentUserId!, { profileVisibility: 'private' })
                    : updateMyStudent(studentUserId!, { profileVisibility: 'private' })
                  req
                    .then(async () => {
                      const full = (isAdminStudent
                        ? (await getStudentProfileByUser(studentUserId!)) as StudentProfileData
                        : (await getCounsellorStudentProfile(studentUserId!)) as StudentProfileData)
                      setProfile(full)
                      notifySuccess(t('common:saved', 'Saved'))
                    })
                    .catch((e) => {
                      setCounsellorVisibility(profile.profileVisibility === 'public' ? 'public' : 'private')
                      setError(getApiError(e).message)
                    })
                }}
              />
              <span>
                <span className="font-medium text-[var(--color-text)] block">{t('profileVisibilityPrivate')}</span>
                <span className="text-sm text-[var(--color-text-muted)]">{t('profileVisibilityPrivateLong')}</span>
              </span>
            </label>
            <label className="flex gap-3 items-start cursor-pointer rounded-card border border-[var(--color-border)] p-3 has-[:checked]:border-primary-accent/50 has-[:checked]:bg-primary-accent/5">
              <input
                type="radio"
                name="external-profile-visibility"
                value="public"
                className="mt-1"
                checked={counsellorVisibility === 'public'}
                onChange={() => {
                  if (counsellorVisibility === 'public') return
                  setCounsellorVisibility('public')
                  const req = isAdminStudent
                    ? updateStudentProfileByUser(studentUserId!, { profileVisibility: 'public' })
                    : updateMyStudent(studentUserId!, { profileVisibility: 'public' })
                  req
                    .then(async () => {
                      const full = (isAdminStudent
                        ? (await getStudentProfileByUser(studentUserId!)) as StudentProfileData
                        : (await getCounsellorStudentProfile(studentUserId!)) as StudentProfileData)
                      setProfile(full)
                      notifySuccess(t('common:saved', 'Saved'))
                    })
                    .catch((e) => {
                      setCounsellorVisibility(profile.profileVisibility === 'public' ? 'public' : 'private')
                      setError(getApiError(e).message)
                    })
                }}
              />
              <span>
                <span className="font-medium text-[var(--color-text)] block">{t('profileVisibilityPublic')}</span>
                <span className="text-sm text-[var(--color-text-muted)]">{t('profileVisibilityPublicLong')}</span>
              </span>
            </label>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayedSections.map((sec) => {
          const isFaculties = sec.id === 'faculties'
          const isDocuments = sec.id === 'documents'
          const facultiesSelected = (profile?.interestedFaculties?.length ?? 0) > 0
          const pct = getSectionPercent(profile, sec.id)
          const Icon = sec.icon
          return (
            <button
              key={sec.id}
              type="button"
              data-onboarding={`student-profile-section-${sec.id}`}
              onClick={() => {
                if (isDocuments && isCounsellorStudent) {
                  navigate(`/school/students/${studentUserId}/documents`)
                  return
                }
                if (isDocuments && !isExternalStudent) {
                  navigate('/student/documents')
                  return
                }
                openEditableSection(sec.id)
              }}
              className={cn(
                'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary-accent)] hover:bg-[var(--color-bg)] hover:scale-[1.02] hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99] transition-all duration-200 text-center min-h-[110px]'
              )}
            >
                <div className={cn(
                  'relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center overflow-hidden bg-[var(--color-border)] shrink-0',
                isFaculties && facultiesSelected && 'ring-2 ring-green-500/50 !bg-green-500/10'
              )}>
                {isFaculties || isDocuments ? (
                  <>
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
                      <path
                        className={isFaculties && facultiesSelected ? 'text-green-500' : 'text-[var(--color-border)]'}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                      />
                    </svg>
                    <span className="relative flex items-center justify-center">
                      {isFaculties && facultiesSelected ? (
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
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                      />
                      <path
                        className="text-[var(--color-primary-accent)] transition-all duration-500"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
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
                <span className="text-sm sm:text-base font-medium text-center line-clamp-2">{getSectionTitle(sec)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Modal
        open={!!openSection}
        onClose={closeSection}
        title={openSection
          ? (() => {
              const section = displayedSections.find((s) => s.id === openSection)
              if (!section) return t('common:details')
              return getSectionTitle(section)
            })()
          : ''}
        footer={openSection ? (
          openSection === 'documents' ? (
            <Button type="button" variant="secondary" onClick={closeSection}>
              {t('common:close', 'Close')}
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={closeSection}>
                {t('common:cancel', 'Cancel')}
              </Button>
              <Button type="button" onClick={handleModalSave} disabled={saving || !hasUnsavedChanges} loading={saving}>
                {t('common:save')}
              </Button>
            </>
          )
        ) : undefined}
      >
        <div className="space-y-4">
          {openSection === 'personal' && (
            <div className="space-y-4" data-onboarding="student-profile-personal-fields">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('firstName')} error={errors.firstName?.message} autoFocus={autoFocusField === 'firstName'} {...register('firstName')} />
                <Input label={t('lastName')} error={errors.lastName?.message} autoFocus={autoFocusField === 'lastName'} {...register('lastName')} />
              </div>
              <Input label={t('birthDate')} type="date" error={errors.birthDate?.message} {...register('birthDate')} />
            </div>
          )}

          {openSection === 'location' && (
            <div className="space-y-4" data-onboarding="student-profile-location-fields">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label={t('country')} error={errors.country?.message} options={countrySelectOptions} placeholder={t('student:countryResidencePlaceholder', 'Select your country')} {...register('country')} />
                <Input label={t('city')} error={errors.city?.message} autoFocus={autoFocusField === 'city'} {...register('city')} placeholder={t('city')} />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="block text-sm font-medium text-[var(--color-text)]">{t('student:preferredStudyCountriesHeading', 'Preferred study countries')}</p>
                    <span className="group relative inline-flex items-center">
                      <span
                        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-amber-500 text-[10px] font-bold leading-none text-amber-500"
                        aria-label={t('student:preferredCountriesDetailedHint', 'Choose the countries where you want to study. We use this to match you with universities in those countries.')}
                      >
                        i
                      </span>
                      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 hidden w-72 -translate-x-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-left text-xs text-[var(--color-text)] shadow-xl group-hover:block">
                        {t('student:preferredCountriesDetailedHint', 'Choose the countries where you want to study. We use this to match you with universities in those countries.')}
                      </span>
                    </span>
                  </div>
                  {countriesWithUniversities.length === 0 ? (
                    <p className="mb-2 text-sm text-[var(--color-text-muted)]">
                      {t(
                        'student:preferredCountriesNoUniversitiesYet',
                        'No countries with universities in the catalog yet. When a university registers and sets its country, that country will appear here for you to choose.'
                      )}
                    </p>
                  ) : null}
                  <ChipSelect
                    options={chipCountryOptions}
                    value={watch('preferredCountries') ?? []}
                    onChange={(countries) => setValue('preferredCountries', dedupeNormalizedCountries(countries), { shouldDirty: true })}
                    max={8}
                    placeholder={t('student:preferredCountriesChipPlaceholder', 'Tap countries to add them')}
                  />
                </div>
              </div>
            </div>
          )}

          {openSection === 'education' && (
            <>
              <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm">
                <span className="text-[var(--color-text-muted)]">{t('student:educationProgressTitle', 'Education setup progress')}</span>
                <span className="font-semibold text-[var(--color-text)]">{educationWizardStep}/{educationVisibleSteps}</span>
              </div>

              {educationWizardStep === 1 && (
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
                        setEducationWizardStep(2)
                        setAutoFocusField('schoolName')
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
              )}

              {educationWizardStep === 2 && (
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
                      <Input label={t('schoolName')} autoFocus={autoFocusField === 'schoolName'} {...register('schoolName')} placeholder="Lyceum No.1" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('gradeLevel')} error={errors.gradeLevel?.message} autoFocus={autoFocusField === 'gradeLevel'} {...register('gradeLevel')} placeholder={t('gradePlaceholder')} />
                        <Input label={t('graduationYear')} type="number" min={1950} max={2030} autoFocus={autoFocusField === 'graduationYear'} {...register('graduationYear')} placeholder="2026" />
                      </div>
                      {educationStatus === 'finished_school' && (
                        <Input label={t('gpa')} type="number" step="0.01" min={0} max={4} error={errors.gpa?.message} {...register('gpa')} placeholder="0-4" />
                      )}
                    </div>
                  )}

                  {(educationStatus === 'in_university' || educationStatus === 'finished_university') && (
                    <div className="space-y-3">
                      <Input label={t('institutionName')} autoFocus={autoFocusField === 'schoolName'} {...register('schoolName')} placeholder="TashGU" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('gradeLevel')} autoFocus={autoFocusField === 'gradeLevel'} {...register('gradeLevel')} placeholder="1 course, 2 course..." />
                        <Input label={t('graduationYear')} type="number" min={1950} max={2030} autoFocus={autoFocusField === 'graduationYear'} {...register('graduationYear')} placeholder="2027" />
                      </div>
                    </div>
                  )}

                  {!isExternalStudent ? (
                    <div className="flex items-center justify-between gap-3 p-3 mt-4 rounded-xl border border-[var(--color-primary-accent)]/30 bg-[var(--color-primary-accent)]/5">
                      <span className="text-sm text-[var(--color-text)]">{t('linkToSchoolHint')}</span>
                      <Link to="/student/schools" className="shrink-0 inline-flex items-center gap-1.5 text-sm text-[var(--color-primary-accent)] font-medium hover:underline">
                        {t('chooseSchool')} <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : null}
                </Card>
              )}

              {educationWizardStep === 3 && needsDegreeGoal && (
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

              {educationWizardStep === (needsDegreeGoal ? 4 : 3) && (
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
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {t('student:certificateUploadHint', 'Confirm your language level with a certificate.')}
                      </p>
                      {!isExternalStudent ? (
                        <Link to="/student/documents" className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary-accent)]">
                          {t('student:uploadCertificate', 'Загрузить сертификат')}
                        </Link>
                      ) : null}
                    </div>

                    {languageCertificates.length > 0 ? (
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                        <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                          {t('student:languageCertificates', 'Language certificates')}
                        </p>
                        <ul className="space-y-1.5">
                          {languageCertificates.map((doc) => (
                            <li key={doc.id} className="text-sm text-[var(--color-text-muted)]">
                              {[doc.certificateType || doc.name || 'Certificate', doc.score ? `(${doc.score})` : '', `- ${doc.status}`].filter(Boolean).join(' ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

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

              <div className="mb-5 flex items-center justify-between gap-3">
                {educationWizardStep > 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEducationWizardStep((prev) => Math.max(1, prev - 1))}
                  >
                    {t('common:prev', 'Back')}
                  </Button>
                ) : <span />}
                {educationWizardStep < educationVisibleSteps ? (
                  <Button
                    type="button"
                    onClick={() => setEducationWizardStep((prev) => Math.min(educationVisibleSteps, prev + 1))}
                    disabled={!canGoNextEducationStep}
                  >
                    {t('common:next', 'Next')}
                  </Button>
                ) : <span />}
              </div>

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
                  {educationStatus !== 'in_school' && (
                    <Checkbox
                      {...register('schoolCompleted')}
                      label={t('schoolCompleted')}
                    />
                  )}
                  <p className="text-sm font-medium text-[var(--color-text)]">{t('schoolsUniversitiesAttended')}</p>
                  <div className="space-y-3">
                {schoolsAttendedFields.map((field, i) => (
                  <Card key={field.id} className="p-4 space-y-2 border border-[var(--color-border)]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('entryNumber', { n: i + 1 })}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSchool(i)} aria-label="Remove"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <Select label={t('institutionTypeLabel')} options={attendedInstitutionTypeOptions} placeholder="—" {...register(`schoolsAttended.${i}.institutionType`)} />
                    <Select label={t('country')} options={schoolCountrySelectOptions} placeholder="—" {...register(`schoolsAttended.${i}.country`)} />
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
            <div className="space-y-4" data-onboarding="student-profile-about-fields">
              <Textarea
                label={t('bio')}
                placeholder={t('bioPlaceholder')}
                rows={4}
                {...register('bio')}
              />
              <FileUpload
                label={t('avatarUrl')}
                variant="avatar"
                value={avatarUrl}
                onChange={onAvatarFileUrlChange}
                hint={t('uploadPhotoOrLink')}
              />
            </div>
          )}

          {openSection === 'budget' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-onboarding="student-profile-budget-fields">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('student:budgetAmount', 'Budget for studies')}</label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  placeholder={t('student:budgetPlaceholder', 'e.g. 10000')}
                  {...register('budgetAmount', {
                    setValueAs: (v) => {
                      if (v === '' || v == null) return undefined
                      if (typeof v === 'number' && Number.isNaN(v)) return undefined
                      const n = Number(v)
                      return Number.isFinite(n) ? n : undefined
                    },
                  })}
                />
              </div>
              <div>
                <Select label={t('student:budgetCurrency', 'Currency')} options={currencyOptions} {...register('budgetCurrency')} />
              </div>
            </div>
          )}

          {openSection === 'skills' && (
            <>
              {!criteria ? (
                <p className="text-[var(--color-text-muted)]">Loading options...</p>
              ) : (
                <>
                <div className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)]">
                  {([
                    {
                      id: 'skills' as const,
                      title: t('skillsSectionTitle', 'Skills'),
                      hint: t('skillsPlaceholder'),
                      options: criteria.skills,
                      value: watch('skills') ?? [],
                      placeholder: t('skillsPlaceholder'),
                    },
                    {
                      id: 'interests' as const,
                      title: t('interestsSectionTitle', 'Interests'),
                      hint: t('interestsSectionHint', 'Subjects and areas you care about - helps match programs and activities.'),
                      options: criteria.interests,
                      value: watch('interests') ?? [],
                      placeholder: t('interestsPlaceholder', 'Select interests'),
                    },
                    {
                      id: 'hobbies' as const,
                      title: t('hobbiesSectionTitle', 'Hobbies'),
                      hint: t('hobbiesSectionHint', 'Activities outside class - optional but improves your profile.'),
                      options: criteria.hobbies,
                      value: watch('hobbies') ?? [],
                      placeholder: t('hobbiesPlaceholder', 'Select hobbies'),
                    },
                  ]).map((panel, index) => {
                    const open = openSkillsPanel === panel.id
                    return (
                      <div key={panel.id} className={cn(index > 0 && 'border-t border-[var(--color-border)]')}>
                        <button
                          type="button"
                          onClick={() => setOpenSkillsPanel(panel.id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                          aria-expanded={open}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[var(--color-text)]">{panel.title}</span>
                            <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">{panel.value.length} / 50</span>
                          </span>
                          <ChevronDown className={cn('h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform', open && 'rotate-180')} aria-hidden />
                        </button>
                        {open ? (
                          <div className="px-4 pb-4">
                            <p className="mb-3 text-xs text-[var(--color-text-muted)]">{panel.hint}</p>
                            <ChipSelect
                              options={panel.options}
                              value={panel.value}
                              onChange={(v) => setValue(panel.id, v, { shouldDirty: true })}
                              max={50}
                              placeholder={panel.placeholder}
                            />
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
                <div className="hidden">
                  <div className="rounded-input border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {t('skillsSectionTitle', 'Skills')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t('skillsPlaceholder')}</p>
                    <ChipSelect
                      options={criteria.skills}
                      value={watch('skills') ?? []}
                      onChange={(v) => setValue('skills', v, { shouldDirty: true })}
                      max={50}
                      placeholder={t('skillsPlaceholder')}
                      className="mt-3"
                    />
                  </div>
                  <div className="rounded-input border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {t('interestsSectionTitle', 'Interests')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {t('interestsSectionHint', 'Subjects and areas you care about — helps match programs and activities.')}
                    </p>
                    <ChipSelect
                      options={criteria.interests}
                      value={watch('interests') ?? []}
                      onChange={(v) => setValue('interests', v, { shouldDirty: true })}
                      max={50}
                      placeholder={t('interestsPlaceholder', 'Select interests')}
                      className="mt-3"
                    />
                  </div>
                  <div className="rounded-input border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {t('hobbiesSectionTitle', 'Hobbies')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {t('hobbiesSectionHint', 'Activities outside class — optional but improves your profile.')}
                    </p>
                    <ChipSelect
                      options={criteria.hobbies}
                      value={watch('hobbies') ?? []}
                      onChange={(v) => setValue('hobbies', v, { shouldDirty: true })}
                      max={50}
                      placeholder={t('hobbiesPlaceholder', 'Select hobbies')}
                      className="mt-3"
                    />
                  </div>
                </div>
                </>
              )}
            </>
          )}

          {openSection === 'faculties' && (
            <div data-onboarding="student-profile-faculty-fields">
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
            </div>
          )}

          {openSection === 'experience' && (
            <>
              <p className="mb-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                {t('experienceOptionalHint', 'Optional — add internships, jobs, or volunteering if you have any.')}
              </p>
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
              <p className="mb-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                {t('worksOptionalHint', 'Optional — projects, awards, clubs, or links that show what you do outside class.')}
              </p>
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
                      onChange={(url) => {
                        if ((watch(`portfolioWorks.${i}.fileUrl`) ?? '') === url) return
                        setValue(`portfolioWorks.${i}.fileUrl`, url, { shouldDirty: true, shouldValidate: true })
                      }}
                      accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/jfif,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs,application/pdf,.pdf"
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

          {openSection === 'documents' && isExternalStudent && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('student:documentsHint', 'Add transcripts, diplomas, language certificates, passport, etc.')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('student:documentType', 'Document type')}</label>
                  <select
                    value={docType}
                    onChange={(e) => {
                      setDocType(e.target.value)
                      if (e.target.value !== 'language_certificate') setDocScore('')
                    }}
                    className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                  >
                    {COUNSELLOR_DOC_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label={t('student:documentName', 'Name')}
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder={docType === 'language_certificate' ? 'e.g. IELTS' : 'e.g. High school diploma'}
                />
              </div>
              {docType === 'language_certificate' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('student:certificateType', 'Certificate type')}</label>
                    <select
                      value={docCertificateType}
                      onChange={(e) => setDocCertificateType(e.target.value)}
                      className="w-full rounded-input border border-[var(--color-border)] px-3 py-2 bg-[var(--color-bg)]"
                    >
                      {COUNSELLOR_LANGUAGE_CERT_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label={t('student:score', 'Score / level')}
                    value={docScore}
                    onChange={(e) => setDocScore(e.target.value)}
                    placeholder="e.g. 7.0, B2"
                  />
                </div>
              ) : null}
              <FileUpload
                label={t('student:file', 'File')}
                value={docFileUrl}
                onChange={setDocFileUrl}
                accept="image/*,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs,application/pdf,.pdf"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddManagedStudentDocument}
                disabled={docAdding || !docFileUrl.trim()}
                loading={docAdding}
                icon={<Plus className="w-4 h-4" />}
              >
                {t('common:add', 'Add')} {t('common:documents', 'document')}
              </Button>
              {documentsLoading ? (
                <p className="text-sm text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">{t('student:noDocumentsYet', 'No documents yet.')}</p>
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {documents.map((doc) => (
                    <li key={doc.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />
                        <span className="font-medium truncate">{doc.name || doc.type.replace(/_/g, ' ')}</span>
                        {doc.type === 'language_certificate' && (doc.certificateType || doc.score) ? (
                          <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                            {[doc.certificateType, doc.score].filter(Boolean).join(' — ')}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="text-sm text-primary-accent hover:underline"
                          onClick={() => setPreviewDocument(doc)}
                        >
                          {t('common:view', 'View')}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDeleteManagedStudentDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        title={t('common:unsavedChangesTitle', 'Unsaved changes')}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setShowUnsavedModal(false)}>
              {t('common:stay', 'Stay')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setShowUnsavedModal(false)
                forceCloseSection()
              }}
            >
              {t('common:discardChanges', 'Discard changes')}
            </Button>
          </>
        )}
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('common:unsavedChanges', 'You have unsaved changes. Close without saving?')}
        </p>
      </Modal>

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
