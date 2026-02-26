import { api } from './api'
import type { PaginationParams, PaginatedResponse } from '@/types/api'
import type { Application, Offer, Recommendation } from '@/types/student'
import type { UniversityListItem } from '@/types/university'

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
  if (Array.isArray(data)) {
    return { data, total: data.length, page: 1 }
  }
  return data ?? { data: [], total: 0, page: 1 }
}

export async function getOffers(params?: PaginationParams): Promise<PaginatedResponse<Offer>> {
  const { data } = await api.get<Offer[] | PaginatedResponse<Offer>>('/student/offers', { params })
  if (Array.isArray(data)) {
    return { data, total: data.length, page: 1 }
  }
  return data ?? { data: [], total: 0, page: 1 }
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
