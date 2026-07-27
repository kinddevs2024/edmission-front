/** List/card item for explore and recommendations */
export interface UniversityListItem {
  id: string
  name: string
  logo?: string
  country?: string
  city?: string
  description?: string
  rating?: number
  foundedYear?: number
  studentCount?: number
  hasScholarship?: boolean
  /** For card: best scholarship coverage when available */
  scholarships?: Array<{ coveragePercent?: number; name?: string }>
  matchScore?: number
  matchBreakdown?: Record<string, number>
  minLanguageLevel?: string
  ieltsMinBand?: number
  gpaMinMode?: 'scale' | 'percent'
  gpaMinValue?: number
  tuitionPrice?: number
  facultyCodes?: string[]
  targetStudentCountries?: string[]
}

export interface UniversityProfile {
  id: string
  userId: string
  name: string
  slug?: string
  logo?: string
  logoUrl?: string
  coverImage?: string
  coverImageUrl?: string
  slogan?: string
  foundedYear?: number
  studentCount?: number
  country?: string
  city?: string
  description?: string
  accreditation?: string
  rating?: number
  onboardingCompleted?: boolean
  createdAt?: string
  updatedAt?: string
  facultyCodes?: string[]
  /** Per-category included items: category id -> item names. If missing, all catalog items for that category. */
  facultyItems?: Record<string, string[]>
  targetStudentCountries?: string[]
  minLanguageLevel?: string
  /** Minimum IELTS band (0–9). Interest may require an uploaded certificate. */
  ieltsMinBand?: number
  gpaMinMode?: 'scale' | 'percent'
  gpaMinValue?: number
  tuitionPrice?: number
  programs?: Program[]
}

export interface Program {
  id: string
  universityId: string
  /** Display title from university / catalog */
  name?: string
  degree?: string
  /** Same as degree in many APIs */
  degreeLevel?: string
  field?: string
  tuition?: number
  tuitionFee?: number
  duration?: string
  durationYears?: number
  language?: string
  requirements?: string
  entryRequirements?: string
}

export interface Faculty {
  id: string
  universityId: string
  name: string
  description: string
  items?: string[]
  order?: number
  createdAt?: string
  updatedAt?: string
}

export interface GlobalFaculty {
  id: string
  code: string
  name: string
  items: string[]
  order?: number
  createdAt?: string
  updatedAt?: string
}

export interface Scholarship {
  id: string
  universityId: string
  name: string
  coveragePercent: number
  maxSlots: number
  usedSlots?: number
  remainingSlots?: number
  /** ISO string from API when valid */
  deadline?: string
  applicationDeadline?: string
  eligibility?: string
  createdAt?: string
}

export interface UniversityFlyer {
  id: string
  universityId?: string
  title?: string
  source?: 'upload' | 'url' | 'editor'
  mediaUrl?: string
  mediaType?: string
  canvasJson?: string
  pageFormat?: 'A4_PORTRAIT' | 'A4_LANDSCAPE' | 'LETTER' | 'CUSTOM'
  width?: number
  height?: number
  editorVersion?: string
  previewImageUrl?: string
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
}

export type PipelineStage =
  | 'interested'
  | 'contacted'
  | 'evaluating'
  | 'offer_sent'
  | 'accepted'
  | 'rejected'
