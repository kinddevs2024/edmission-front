import { api } from './api'
import type { PaginationParams, PaginatedResponse } from '@/types/api'
import type { UniversityProfile, Scholarship } from '@/types/university'

type UniversityProfileResponse = UniversityProfile & { universityName?: string; tagline?: string; establishedYear?: number }

export async function getProfile(): Promise<UniversityProfile> {
  const { data } = await api.get<UniversityProfileResponse>('/university/profile')
  return {
    ...data,
    name: data.name ?? data.universityName ?? '',
    slogan: data.slogan ?? data.tagline,
    foundedYear: data.foundedYear ?? data.establishedYear,
  }
}

export async function updateProfile(patch: Partial<UniversityProfile>): Promise<UniversityProfile> {
  const body: Record<string, unknown> = {}
  if (patch.name != null) body.universityName = patch.name
  if (patch.slogan != null) body.tagline = patch.slogan
  if (patch.foundedYear != null) body.establishedYear = patch.foundedYear
  if (patch.studentCount != null) body.studentCount = patch.studentCount
  if (patch.country != null) body.country = patch.country
  if (patch.city != null) body.city = patch.city
  if (patch.description != null) body.description = patch.description
  const logoUrl = (patch as { logoUrl?: string }).logoUrl ?? patch.logo
  if (logoUrl != null) body.logoUrl = logoUrl
  const { data } = await api.put<UniversityProfileResponse | null>('/university/profile', body)
  const raw = data ?? {}
  return {
    ...raw,
    id: (raw as UniversityProfileResponse).id ?? ((raw as { _id?: unknown })._id != null ? String((raw as { _id: unknown })._id) : ''),
    name: (raw as UniversityProfileResponse).name ?? (raw as UniversityProfileResponse).universityName ?? '',
    slogan: (raw as UniversityProfileResponse).slogan ?? (raw as UniversityProfileResponse).tagline,
    foundedYear: (raw as UniversityProfileResponse).foundedYear ?? (raw as UniversityProfileResponse).establishedYear,
  } as UniversityProfile
}

export async function getScholarships(params?: PaginationParams): Promise<PaginatedResponse<Scholarship>> {
  const { data } = await api.get<Scholarship[] | PaginatedResponse<Scholarship>>('/university/scholarships', { params })
  if (Array.isArray(data)) return { data, total: data.length, page: 1, limit: data.length, totalPages: 1 }
  return data
}

export async function createScholarship(payload: Omit<Scholarship, 'id' | 'universityId' | 'usedSlots' | 'createdAt'>): Promise<Scholarship> {
  const { data } = await api.post<Scholarship>('/university/scholarships', payload)
  return data
}

export interface FunnelAnalytics {
  byStatus: Record<string, number>
  total: number
}

export async function getFunnelAnalytics(): Promise<FunnelAnalytics> {
  const { data } = await api.get<FunnelAnalytics>('/university/analytics/funnel')
  return data ?? { byStatus: {}, total: 0 }
}

export interface UniversityDashboardData {
  pipeline: { status: string; _count: number }[]
  pendingOffers: number
  totalInterests?: number
  interestedCount?: number
  chatCount?: number
  offerSentCount?: number
  acceptedCount?: number
  acceptanceRate?: number
  verified?: boolean
  topRecommendations: { id: string; matchScore?: number; student?: { _id?: string; firstName?: string; lastName?: string; gpa?: number; country?: string } }[]
}

export async function getDashboard(): Promise<UniversityDashboardData> {
  const { data } = await api.get<UniversityDashboardData>('/university/dashboard')
  return data ?? { pipeline: [], pendingOffers: 0, topRecommendations: [] }
}

export interface PipelineItem {
  id: string
  status: string
  student?: { _id?: unknown; firstName?: string; lastName?: string; country?: string; gpa?: number }
  updatedAt?: string
}

export interface PipelineFilters {
  skills?: string[]
  interests?: string[]
  hobbies?: string[]
}

export interface StudentSearchParams {
  page?: number
  limit?: number
  skills?: string[]
  interests?: string[]
  hobbies?: string[]
  country?: string
  city?: string
  languages?: string[]
  certType?: string
  certMinScore?: string
}

export interface DiscoverStudentItem {
  id: string
  student: {
    firstName?: string
    lastName?: string
    country?: string
    city?: string
    gpa?: number
    gradeLevel?: string
    languages?: { language: string; level: string }[]
    skills?: string[]
    interests?: string[]
    hobbies?: string[]
    schoolName?: string
    graduationYear?: number
  }
  inPipeline: boolean
}

export interface StudentSearchResponse {
  data: DiscoverStudentItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getStudents(params?: StudentSearchParams): Promise<StudentSearchResponse> {
  const query: Record<string, string> = {}
  if (params?.page != null) query.page = String(params.page)
  if (params?.limit != null) query.limit = String(params.limit)
  if (params?.skills?.length) query.skills = params.skills.join(',')
  if (params?.interests?.length) query.interests = params.interests.join(',')
  if (params?.hobbies?.length) query.hobbies = params.hobbies.join(',')
  if (params?.country) query.country = params.country
  if (params?.city) query.city = params.city
  if (params?.languages?.length) query.languages = params.languages.join(',')
  if (params?.certType) query.certType = params.certType
  if (params?.certMinScore != null) query.certMinScore = params.certMinScore
  const { data } = await api.get<StudentSearchResponse>('/university/students', { params: query })
  return data ?? { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
}

export interface FullStudentProfile {
  id: string
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
  experiences?: { type: string; title?: string; organization?: string; startDate?: string; endDate?: string; description?: string }[]
  portfolioWorks?: { title?: string; description?: string; fileUrl?: string; linkUrl?: string }[]
  portfolioCompletionPercent?: number
  verifiedAt?: string
  documents?: { id: string; type: string; name?: string; certificateType?: string; score?: string; fileUrl: string }[]
}

export async function getStudentProfile(studentId: string): Promise<FullStudentProfile> {
  const { data } = await api.get<FullStudentProfile>(`/university/students/${studentId}/profile`)
  if (!data) throw new Error('Student not found')
  return data
}

export async function getPipeline(filters?: PipelineFilters): Promise<PipelineItem[]> {
  const params: Record<string, string> = {}
  if (filters?.skills?.length) params.skills = filters.skills.join(',')
  if (filters?.interests?.length) params.interests = filters.interests.join(',')
  if (filters?.hobbies?.length) params.hobbies = filters.hobbies.join(',')
  const { data } = await api.get<PipelineItem[] | unknown>('/university/pipeline', { params })
  return Array.isArray(data) ? data : []
}

export async function createOffer(payload: {
  studentId: string
  scholarshipId?: string
  coveragePercent: number
  deadline?: string
}): Promise<unknown> {
  const { data } = await api.post('/university/offers', payload)
  return data
}

export async function updateInterestStatus(
  interestId: string,
  status: 'interested' | 'under_review' | 'chat_opened' | 'offer_sent' | 'rejected' | 'accepted'
): Promise<unknown> {
  const { data } = await api.patch(`/university/interests/${interestId}`, { status })
  return data
}
