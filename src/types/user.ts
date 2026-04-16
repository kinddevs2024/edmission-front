export type Role =
  | 'student'
  | 'university'
  | 'university_multi_manager'
  | 'admin'
  | 'school_counsellor'
  | 'counsellor_coordinator'
  | 'manager'

export interface SubscriptionSummary {
  plan: string
  status: string
  trialEndsAt: string | null
  applicationLimit: number | null
  applicationCurrent: number
  offerLimit: number | null
  offerCurrent: number
  chatModel: string
  trialExpired: boolean
}

export interface NotificationPreferences {
  emailApplicationUpdates?: boolean
  emailTrialReminder?: boolean
}

export interface SocialLinks {
  telegram?: string
  instagram?: string
  linkedin?: string
  facebook?: string
  whatsapp?: string
}

export interface User {
  id: string
  email: string
  role: Role
  name?: string
  phone?: string
  socialLinks?: SocialLinks
  avatar?: string
  onboardingTutorialSeen?: { student?: boolean; university?: boolean }
  emailVerified?: boolean
  createdAt?: string
  /** When true, user must set a new password on next login (e.g. temp password from school counsellor). */
  mustChangePassword?: boolean
  /** When true, user signed up with Google/Yandex and must choose a password for email login. */
  mustSetLocalPassword?: boolean
  /** When false, account has no real local password yet (OAuth-only); use set-password first. */
  localPasswordConfigured?: boolean
  subscription?: SubscriptionSummary
  notificationPreferences?: NotificationPreferences
  studentProfile?: {
    id: string
    verifiedAt?: string | null
    educationStatus?: 'in_school' | 'finished_school' | 'in_university' | 'finished_university'
    /** When set, student is managed by a school counsellor; hide school linking nav and school name for universities. */
    counsellorUserId?: string
  }
  universityProfile?: { id: string; verified?: boolean; universityName?: string; logoUrl?: string }
  /** When role is `university_multi_manager`: universities this user may open in delegated mode (after admin approval). */
  managedUniversities?: Array<{ userId: string; universityName: string; logoUrl?: string; verified: boolean }>
  /** Admin must approve before delegated university APIs work. */
  universityMultiManagerApproved?: boolean
  totpEnabled?: boolean
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}
