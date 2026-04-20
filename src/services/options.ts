import { api } from './api'

export interface ProfileCriteria {
  skills: string[]
  interests: string[]
  hobbies: string[]
}

export async function getProfileCriteria(): Promise<ProfileCriteria> {
  const { data } = await api.get<ProfileCriteria>('/options/profile-criteria')
  return data
}

/** Countries where the platform has at least one university (catalog or verified profile). Public endpoint. */
export async function getUniversityHubCountries(): Promise<string[]> {
  const { data } = await api.get<{ data?: string[] }>('/options/university-countries')
  return data?.data ?? []
}
