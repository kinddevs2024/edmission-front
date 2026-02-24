export type Role = 'student' | 'university' | 'admin'

export interface User {
  id: string
  email: string
  role: Role
  name?: string
  avatar?: string
  emailVerified?: boolean
  createdAt?: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}
