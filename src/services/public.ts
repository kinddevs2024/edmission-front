import { api } from './api'

const VISITOR_ID_STORAGE_KEY = 'edmission_visitor_id'

function createVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server'
  const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY)
  if (existing) return existing
  const next = createVisitorId()
  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, next)
  return next
}

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

export async function trackSiteVisit(path: string): Promise<void> {
  await api.post('/public/analytics/visit', {
    visitorId: getVisitorId(),
    path,
  })
}
