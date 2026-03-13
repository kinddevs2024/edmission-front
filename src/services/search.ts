import { api } from './api'

export interface SearchUniversityItem {
  id: string
  name: string
  country?: string
  city?: string
  source: 'catalog' | 'profile'
}

export interface SearchStudentItem {
  id: string
  firstName?: string
  lastName?: string
  country?: string
  city?: string
}

export interface SearchChatMessageItem {
  id: string
  chatId: string
  text: string
  createdAt?: string
}

export interface SearchResult {
  universities: SearchUniversityItem[]
  students: SearchStudentItem[]
  chatMessages?: SearchChatMessageItem[]
}

export async function search(q: string): Promise<SearchResult> {
  const trimmed = q?.trim()
  if (!trimmed) return { universities: [], students: [] }
  const { data } = await api.get<SearchResult>('/search', { params: { q: trimmed } })
  return data ?? { universities: [], students: [], chatMessages: [] }
}
