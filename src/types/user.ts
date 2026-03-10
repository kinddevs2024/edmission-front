export type Role = 'student' | 'university' | 'admin' | 'school_counsellor'

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

export interface User {
  id: string
  email: string
  role: Role
  name?: string
  avatar?: string
  emailVerified?: boolean
  createdAt?: string
  /** When true, user must set a new password on next login (e.g. temp password from school counsellor). */
  mustChangePassword?: boolean
  subscription?: SubscriptionSummary
  notificationPreferences?: NotificationPreferences
  studentProfile?: { id: string; verifiedAt?: string | null }
  universityProfile?: { id: string; verified?: boolean; universityName?: string }
  totpEnabled?: boolean
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}
