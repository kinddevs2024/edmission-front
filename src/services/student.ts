import { api } from './api'
import type { PaginationParams, PaginatedResponse } from '@/types/api'
import type { Application, Offer, Recommendation } from '@/types/student'
import type { UniversityListItem } from '@/types/university'

export interface StudentExperience {
  _id?: string
  type: 'volunteer' | 'internship' | 'work'
  title?: string
  organization?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface StudentPortfolioWork {
  _id?: string
  title?: string
  description?: string
  fileUrl?: string
  linkUrl?: string
}

export interface StudentProfileData {
  id?: string
  userId?: string
  firstName?: string
  lastName?: string
  birthDate?: string
  country?: string
  city?: string
  gradeLevel?: string
  gpa?: number
  languageLevel?: string
  languages?: { language: string; level: string }[]
  bio?: string
  avatarUrl?: string
  schoolCompleted?: boolean
  schoolName?: string
  graduationYear?: number
  skills?: string[]
  interests?: string[]
  hobbies?: string[]
  experiences?: StudentExperience[]
  portfolioWorks?: StudentPortfolioWork[]
  portfolioCompletionPercent?: number
  user?: { email: string; emailVerified?: boolean }
}

export async function getStudentProfile(): Promise<StudentProfileData> {
  const { data } = await api.get<StudentProfileData>('/student/profile')
  return data
}

export async function updateStudentProfile(patch: Partial<StudentProfileData>): Promise<StudentProfileData> {
  const { data } = await api.patch<StudentProfileData>('/student/profile', patch)
  return data
}

export interface UniversitiesParams extends PaginationParams {
  country?: string
  city?: string
  degree?: string
  hasScholarship?: boolean
  sort?: 'match' | 'name' | 'rating'
}

function normalizeUniversityItem(u: UniversityListItem & { universityName?: string }): UniversityListItem {
  return { ...u, name: u.name ?? u.universityName ?? '' }
}

export async function getUniversities(params?: UniversitiesParams): Promise<PaginatedResponse<UniversityListItem>> {
  const res = await api.get<PaginatedResponse<UniversityListItem & { universityName?: string }>>('/student/universities', { params })
  const body = res.data
  if (!body) return { data: [], total: 0, page: 1 }
  const list = (body as { data?: (UniversityListItem & { universityName?: string })[] }).data ?? []
  const total = (body as { total?: number }).total ?? 0
  const page = (body as { page?: number }).page ?? 1
  return { data: list.map(normalizeUniversityItem), total, page }
}

export async function getRecommendations(params?: PaginationParams): Promise<PaginatedResponse<Recommendation>> {
  const { data } = await api.get<Recommendation[] | PaginatedResponse<Recommendation>>('/student/recommendations', { params })
  if (Array.isArray(data)) {
    return { data, total: data.length, page: 1 }
  }
  return data
}

export async function getApplications(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<Application>> {
  const { data } = await api.get<Application[] | PaginatedResponse<Application>>('/student/applications', { params })
  const list = Array.isArray(data) ? data : (data as PaginatedResponse<Application>)?.data ?? []
  const total = Array.isArray(data) ? list.length : (data as PaginatedResponse<Application>)?.total ?? 0
  const page = Array.isArray(data) ? 1 : (data as PaginatedResponse<Application>)?.page ?? 1
  const normalized = list.map((a: Application & { university?: { universityName?: string; country?: string; city?: string } }) => ({
    ...a,
    universityName: a.universityName ?? a.university?.universityName,
  }))
  return { data: normalized, total, page }
}

export async function getOffers(params?: PaginationParams): Promise<PaginatedResponse<Offer>> {
  const { data } = await api.get<Offer[] | PaginatedResponse<Offer>>('/student/offers', { params })
  const list = Array.isArray(data) ? data : (data as PaginatedResponse<Offer>)?.data ?? []
  const total = Array.isArray(data) ? data.length : (data as PaginatedResponse<Offer>)?.total ?? 0
  const page = Array.isArray(data) ? 1 : (data as PaginatedResponse<Offer>)?.page ?? 1
  const normalized = list.map((o: Offer & { university?: { universityName?: string }; scholarship?: { name?: string; coveragePercent?: number } }) => ({
    ...o,
    universityName: o.universityName ?? o.university?.universityName,
    scholarshipType: (o.scholarshipType ?? (o.scholarship?.coveragePercent === 100 ? 'full' : 'partial')) as Offer['scholarshipType'],
    coveragePercent: o.coveragePercent ?? o.scholarship?.coveragePercent,
  }))
  return { data: normalized, total, page }
}

export interface InterestLimit {
  allowed: boolean
  current: number
  limit: number | null
  trialExpired?: boolean
}

export async function getInterestLimit(): Promise<InterestLimit> {
  const { data } = await api.get<InterestLimit>('/student/interests/limit')
  return data ?? { allowed: false, current: 0, limit: 3 }
}

export async function showInterest(universityId: string): Promise<void> {
  await api.post(`/student/universities/${universityId}/interest`)
}

export async function acceptOffer(offerId: string): Promise<void> {
  await api.post(`/student/offers/${offerId}/accept`)
}

export async function declineOffer(offerId: string): Promise<void> {
  await api.post(`/student/offers/${offerId}/decline`)
}

/** Fetch universities by ids (for compare or recommendations). Returns array. */
export async function getCompareUniversities(ids: string[]): Promise<UniversityListItem[]> {
  if (ids.length === 0) return []
  const { data } = await api.get<UniversityListItem[] | { data: (UniversityListItem & { universityName?: string })[] }>(
    '/student/compare',
    { params: { ids: ids.join(',') } }
  )
  const list = Array.isArray(data) ? data : (data?.data ?? [])
  return list.map((u) => normalizeUniversityItem(u as UniversityListItem & { universityName?: string }))
}
