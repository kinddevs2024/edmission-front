export type Role =
  | 'student'
  | 'university'
  | 'university_multi_manager'
  | 'multi_university_admin'
  | 'admin'
  | 'school_counsellor'
  | 'counsellor_coordinator'
  | 'manager'

export const UNIVERSITY_LIKE_ROLES: Role[] = [
  'university',
  'university_multi_manager',
  'multi_university_admin',
]

export function isUniversityLikeRole(role: Role | null | undefined): role is Extract<Role, 'university' | 'university_multi_manager' | 'multi_university_admin'> {
  return role === 'university' || role === 'university_multi_manager' || role === 'multi_university_admin'
}

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
  smsApplicationUpdates?: boolean
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
  language?: 'en' | 'ru' | 'uz'
  name?: string
  phone?: string
  socialLinks?: SocialLinks
  linkedProviders?: {
    email?: boolean
    phone?: boolean
    google?: boolean
    apple?: boolean
    yandex?: boolean
    telegram?: boolean
  }
  temporaryPassword?: string
  avatar?: string
  onboardingTutorialSeen?: { student?: boolean; university?: boolean }
  emailVerified?: boolean
  createdAt?: string
  /** When true, user must set a new password on next login (e.g. temp password from school counsellor). */
  mustChangePassword?: boolean
  /** When true, user signed up with Google/Yandex/Apple and must choose a password for email login. */
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
  /** When role is `university_multi_manager` or `multi_university_admin`: universities this user may open in delegated mode. */
  managedUniversities?: Array<{ userId: string; universityName: string; logoUrl?: string; verified: boolean; source?: string }>
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
