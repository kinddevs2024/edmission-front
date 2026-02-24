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

export async function getUniversities(params?: UniversitiesParams): Promise<PaginatedResponse<UniversityListItem>> {
  const { data } = await api.get<PaginatedResponse<UniversityListItem>>('/universities', { params })
  return data
}

export async function getRecommendations(params?: PaginationParams): Promise<PaginatedResponse<Recommendation>> {
  const { data } = await api.get<PaginatedResponse<Recommendation>>('/student/recommendations', { params })
  return data
}

export async function getApplications(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<Application>> {
  const { data } = await api.get<PaginatedResponse<Application>>('/student/applications', { params })
  return data
}

export async function getOffers(params?: PaginationParams): Promise<PaginatedResponse<Offer>> {
  const { data } = await api.get<PaginatedResponse<Offer>>('/student/offers', { params })
  return data
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
