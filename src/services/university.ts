import { api } from './api'
import type { PaginationParams, PaginatedResponse } from '@/types/api'
import type { UniversityProfile, Scholarship } from '@/types/university'

export async function getProfile(): Promise<UniversityProfile> {
  const { data } = await api.get<UniversityProfile>('/university/profile')
  return data
}

export async function updateProfile(patch: Partial<UniversityProfile>): Promise<UniversityProfile> {
  const { data } = await api.patch<UniversityProfile>('/university/profile', patch)
  return data
}

export async function getScholarships(params?: PaginationParams): Promise<PaginatedResponse<Scholarship>> {
  const { data } = await api.get<PaginatedResponse<Scholarship>>('/university/scholarships', { params })
  return data
}

export async function createScholarship(payload: Omit<Scholarship, 'id' | 'universityId' | 'usedSlots' | 'createdAt'>): Promise<Scholarship> {
  const { data } = await api.post<Scholarship>('/university/scholarships', payload)
  return data
}
