import { api } from './api'
import { getUniversityHubCountries } from '@/services/options'
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

export interface SchoolAttendedItem {
  _id?: string
  country?: string
  institutionName?: string
  /** 'school' | 'university' — for labels and filtering */
  institutionType?: 'school' | 'university'
  educationLevel?: string
  gradingScheme?: string
  gradeScale?: number
  gradeAverage?: number
  primaryLanguage?: string
  attendedFrom?: string
  attendedTo?: string
  degreeName?: string
}

export type EducationStatus = 'in_school' | 'finished_school' | 'in_university' | 'finished_university'

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
  educationStatus?: EducationStatus
  schoolCompleted?: boolean
  schoolName?: string
  graduationYear?: number
  gradingScheme?: string
  gradeScale?: number
  highestEducationLevel?: string
  targetDegreeLevel?: 'bachelor' | 'master' | 'phd'
  schoolsAttended?: SchoolAttendedItem[]
  skills?: string[]
  interests?: string[]
  hobbies?: string[]
  experiences?: StudentExperience[]
  portfolioWorks?: StudentPortfolioWork[]
  portfolioCompletionPercent?: number
  minimalPortfolioComplete?: boolean
  user?: { email: string; emailVerified?: boolean }
  interestedFaculties?: string[]
  preferredCountries?: string[]
  budgetAmount?: number
  budgetCurrency?: string
  /** Default private: universities see a reduced profile. */
  profileVisibility?: 'private' | 'public'
}

export async function getStudentProfile(): Promise<StudentProfileData> {
  const { data } = await api.get<StudentProfileData>('/student/profile')
  return data
}

export async function getStudentUniversityCountries(): Promise<string[]> {
  return getUniversityHubCountries()
}

export async function updateStudentProfile(patch: Partial<StudentProfileData>): Promise<StudentProfileData> {
  const { data } = await api.patch<StudentProfileData>('/student/profile', patch)
  return data
}

export interface UniversitiesParams extends PaginationParams {
  search?: string
  country?: string
  hasScholarship?: boolean
  facultyCodes?: string[]
  degreeLevels?: string[]
  programLanguages?: string[]
  targetStudentCountries?: string[]
  minTuition?: number
  maxTuition?: number
  minEstablishedYear?: number
  maxEstablishedYear?: number
  minStudentCount?: number
  maxStudentCount?: number
  requirementsQuery?: string
  programQuery?: string
  sort?: 'match' | 'name' | 'rating' | 'tuition_asc' | 'tuition_desc' | 'newest'
  /** When false, backend does not filter by profile (interestedFaculties, preferredCountries). Use after "Clear". */
  useProfileFilters?: boolean
}

function normalizeUniversityItem(
  u: UniversityListItem & {
    universityName?: string
    logoUrl?: string
    breakdown?: Record<string, number>
    matchBreakdown?: Record<string, number>
    foundedYear?: number
    establishedYear?: number
    studentCount?: number
    targetStudentCountries?: string[]
  }
): UniversityListItem {
  return {
    ...u,
    name: u.name ?? u.universityName ?? '',
    logo: u.logo ?? u.logoUrl,
    matchBreakdown: u.matchBreakdown ?? u.breakdown,
  }
}

export async function getUniversities(params?: UniversitiesParams): Promise<PaginatedResponse<UniversityListItem>> {
  const query: Record<string, string> = {}
  if (params?.page != null) query.page = String(params.page)
  if (params?.limit != null) query.limit = String(params.limit)
  if (params?.search) query.search = params.search
  if (params?.country) query.country = params.country
  if (params?.hasScholarship) query.hasScholarship = '1'
  if (params?.facultyCodes?.length) query.facultyCodes = params.facultyCodes.join(',')
  if (params?.degreeLevels?.length) query.degreeLevels = params.degreeLevels.join(',')
  if (params?.programLanguages?.length) query.programLanguages = params.programLanguages.join(',')
  if (params?.targetStudentCountries?.length) query.targetStudentCountries = params.targetStudentCountries.join(',')
  if (params?.minTuition != null) query.minTuition = String(params.minTuition)
  if (params?.maxTuition != null) query.maxTuition = String(params.maxTuition)
  if (params?.minEstablishedYear != null) query.minEstablishedYear = String(params.minEstablishedYear)
  if (params?.maxEstablishedYear != null) query.maxEstablishedYear = String(params.maxEstablishedYear)
  if (params?.minStudentCount != null) query.minStudentCount = String(params.minStudentCount)
  if (params?.maxStudentCount != null) query.maxStudentCount = String(params.maxStudentCount)
  if (params?.requirementsQuery) query.requirementsQuery = params.requirementsQuery
  if (params?.programQuery) query.programQuery = params.programQuery
  if (params?.sort) query.sort = params.sort
  if (params?.useProfileFilters === false) query.useProfileFilters = '0'

  const res = await api.get<PaginatedResponse<UniversityListItem & { universityName?: string }>>('/student/universities', { params: query })
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
    expiresAt: (o as any).expiresAt,
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

/** Lightweight: returns only university IDs the student has shown interest in. */
export async function getInterestedUniversityIds(): Promise<string[]> {
  const { data } = await api.get<{ ids: string[] }>('/student/interests/university-ids')
  return data?.ids ?? []
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

export async function waitOffer(offerId: string): Promise<void> {
  await api.post(`/student/offers/${offerId}/wait`)
}

export interface SchoolsListResponse {
  data: { id: string; counsellorUserId: string; schoolName: string; schoolDescription: string; country: string; city: string; counsellorName: string; requestStatus?: 'pending' | 'accepted' | null }[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function listSchools(params?: { search?: string; page?: number; limit?: number }): Promise<SchoolsListResponse> {
  const { data } = await api.get<SchoolsListResponse>('/student/schools', { params })
  return data
}

export async function requestToJoinSchool(counsellorUserId: string): Promise<void> {
  await api.post(`/student/schools/${counsellorUserId}/request`)
}

export interface SchoolInvitationItem {
  id: string
  counsellorUserId: string
  schoolName: string
  city: string
  country: string
  createdAt: string
}

export async function listSchoolInvitations(): Promise<SchoolInvitationItem[]> {
  const { data } = await api.get<SchoolInvitationItem[]>('/student/school-invitations')
  return data ?? []
}

export async function acceptSchoolInvitation(invitationId: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>(`/student/school-invitations/${invitationId}/accept`)
  return data
}

export async function declineSchoolInvitation(invitationId: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>(`/student/school-invitations/${invitationId}/decline`)
  return data
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
