export type Role = 'student' | 'university' | 'admin'

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
  subscription?: SubscriptionSummary
  notificationPreferences?: NotificationPreferences
  studentProfile?: { id: string; verifiedAt?: string | null }
  totpEnabled?: boolean
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}
