export type ApplicationStatus =
  | 'interested'
  | 'under_review'
  | 'chat_opened'
  | 'offer_sent'
  | 'rejected'
  | 'accepted'

export interface StudentProfile {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  classYear?: number
  gpa?: number
  country?: string
  interests?: string[]
  portfolioCompletionPercent?: number
  createdAt?: string
  updatedAt?: string
}

export interface Recommendation {
  universityId: string
  matchScore: number
  breakdown?: Record<string, number>
}

export interface Application {
  id: string
  universityId: string
  universityName?: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  lastMessageAt?: string
}

export interface Offer {
  id: string
  applicationId: string
  universityId: string
  universityName?: string
  scholarshipType: 'full' | 'partial' | 'budget'
  coveragePercent?: number
  deadline: string
  isUrgent?: boolean
  createdAt: string
}
