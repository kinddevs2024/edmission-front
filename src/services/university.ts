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
  const { data } = await api.get<PaginatedResponse<Scholarship>>('/university/scholarships', { params })
  return data
}

export async function createScholarship(payload: Omit<Scholarship, 'id' | 'universityId' | 'usedSlots' | 'createdAt'>): Promise<Scholarship> {
  const { data } = await api.post<Scholarship>('/university/scholarships', payload)
  return data
}
