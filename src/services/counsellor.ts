import { api } from './api'

export interface CounsellorProfile {
  id: string
  userId: string
  schoolName: string
  schoolDescription: string
  country: string
  city: string
  isPublic: boolean
}

export interface SchoolItem {
  id: string
  counsellorUserId: string
  schoolName: string
  schoolDescription: string
  country: string
  city: string
  counsellorName: string
}

export interface CounsellorStudent {
  id: string
  userId: string
  email: string
  name: string
  firstName: string
  lastName: string
  country: string
  city: string
  mustChangePassword?: boolean
}

export interface CreateStudentResult {
  user: { id: string; email: string; name: string; role: string }
  temporaryPassword: string
}

export interface JoinRequestItem {
  id: string
  studentId: string
  status: string
  createdAt: string
  studentEmail: string
  studentName: string
}

export async function getCounsellorProfile(): Promise<CounsellorProfile> {
  const { data } = await api.get<CounsellorProfile>('/counsellor/profile')
  return data
}

export async function updateCounsellorProfile(patch: Partial<Pick<CounsellorProfile, 'schoolName' | 'schoolDescription' | 'country' | 'city' | 'isPublic'>>): Promise<CounsellorProfile> {
  const { data } = await api.patch<CounsellorProfile>('/counsellor/profile', patch)
  return data
}

export async function createStudent(body: { email: string; name?: string; firstName?: string; lastName?: string }): Promise<CreateStudentResult> {
  const { data } = await api.post<CreateStudentResult>('/counsellor/students', body)
  return data
}

export async function listMyStudents(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: CounsellorStudent[]; total: number; page: number; limit: number; totalPages: number }> {
  const { data } = await api.get('/counsellor/students', { params })
  return data
}

export async function updateMyStudent(studentUserId: string, patch: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.patch(`/counsellor/students/${studentUserId}`, patch)
  return data
}

export async function deleteMyStudent(studentUserId: string): Promise<void> {
  await api.delete(`/counsellor/students/${studentUserId}`)
}

export async function getStudentProfile(studentUserId: string): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/counsellor/students/${studentUserId}`)
  return data
}

export async function generateTempPassword(studentUserId: string): Promise<{ temporaryPassword: string }> {
  const { data } = await api.post<{ temporaryPassword: string }>(`/counsellor/students/${studentUserId}/generate-temp-password`)
  return data
}

export async function listJoinRequests(params?: { status?: string; page?: number; limit?: number }): Promise<{ data: JoinRequestItem[]; total: number; page: number; limit: number; totalPages: number }> {
  const { data } = await api.get('/counsellor/join-requests', { params })
  return data
}

export async function acceptJoinRequest(requestId: string): Promise<void> {
  await api.post(`/counsellor/join-requests/${requestId}/accept`)
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  await api.post(`/counsellor/join-requests/${requestId}/reject`)
}

export async function addInterestForStudent(studentUserId: string, universityId: string): Promise<unknown> {
  const { data } = await api.post(`/counsellor/students/${studentUserId}/interests/${universityId}`)
  return data
}
