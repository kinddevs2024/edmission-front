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
  matchScore?: number
  matchBreakdown?: Record<string, number>
  minLanguageLevel?: string
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
  tuitionPrice?: number
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

export type PipelineStage =
  | 'interested'
  | 'contacted'
  | 'evaluating'
  | 'offer_sent'
  | 'accepted'
  | 'rejected'
