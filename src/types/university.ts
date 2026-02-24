/** List/card item for explore and recommendations */
export interface UniversityListItem {
  id: string
  name: string
  logo?: string
  country?: string
  city?: string
  description?: string
  rating?: number
  hasScholarship?: boolean
  matchScore?: number
  matchBreakdown?: Record<string, number>
}

export interface UniversityProfile {
  id: string
  userId: string
  name: string
  slug?: string
  logo?: string
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
}

export interface Program {
  id: string
  universityId: string
  degree: string
  field: string
  tuition?: number
  duration?: string
  language?: string
  requirements?: string
}

export interface Scholarship {
  id: string
  universityId: string
  name: string
  coveragePercent: number
  maxSlots: number
  usedSlots: number
  deadline: string
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
