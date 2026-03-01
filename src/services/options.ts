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
