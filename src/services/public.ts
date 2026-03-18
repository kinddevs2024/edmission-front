import { api } from './api'

export interface LandingCertificate {
  id: string
  type: 'university' | 'student'
  title: string
  imageUrl: string
  order: number
}

export async function getLandingCertificates(): Promise<LandingCertificate[]> {
  const { data } = await api.get<LandingCertificate[]>('/public/landing-certificates')
  return data ?? []
}

export interface PublicStats {
  universities: number
  students: number
  scholarships: number
}

export interface TrustedUniversityLogo {
  id: string
  name: string
  logoUrl: string
}

export async function getPublicStats(): Promise<PublicStats> {
  const { data } = await api.get<PublicStats>('/public/stats')
  return data ?? { universities: 0, students: 0, scholarships: 0 }
}

export async function getTrustedUniversityLogos(): Promise<TrustedUniversityLogo[]> {
  const { data } = await api.get<TrustedUniversityLogo[]>('/public/trusted-university-logos')
  return Array.isArray(data) ? data : []
}
