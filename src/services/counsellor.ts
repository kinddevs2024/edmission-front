import { api } from './api'
import { assertMaxUploadSize } from '@/services/upload'
import type { DocumentPageFormat } from '@/types/documentModule'
import type { PaginatedResponse, PaginationParams } from '@/types/api'
import type { UniversityListItem } from '@/types/university'

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
  temporaryPassword?: string
}

export interface CounsellorStudentsImportResult {
  created: number
  updated: number
  errors: Array<{ row: number; name: string; message: string }>
}

export interface CounsellorApplication {
  id: string
  source: 'profile' | 'catalog'
  studentProfileId: string
  studentUserId: string
  studentName: string
  studentEmail: string
  universityId: string
  universityName?: string
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface CounsellorOffer {
  id: string
  type: 'offer' | 'scholarship'
  status: string
  title?: string
  universityMessage?: string
  sentAt?: string
  viewedAt?: string
  decisionAt?: string
  postponeUntil?: string
  expiresAt?: string
  createdAt?: string
  updatedAt?: string
  studentProfileId: string
  studentUserId: string
  studentName: string
  studentEmail: string
  universityId: string
  university?: {
    name: string
    logoUrl?: string
    city?: string
    country?: string
  }
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

export async function listMyApplications(params?: { page?: number; limit?: number; status?: string; studentUserId?: string }): Promise<{
  data: CounsellorApplication[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const { data } = await api.get('/counsellor/applications', { params })
  return data
}

export async function listMyOffers(params?: { page?: number; limit?: number; status?: string; type?: string; studentUserId?: string }): Promise<{
  data: CounsellorOffer[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const { data } = await api.get('/counsellor/offers', { params })
  return data
}

export async function downloadCounsellorStudentsTemplate(): Promise<void> {
  const { data } = await api.get<Blob>('/counsellor/students/template', { responseType: 'blob' })
  const url = URL.createObjectURL(data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'counsellor_students_template.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadCounsellorStudentsExcel(): Promise<void> {
  const { data } = await api.get<Blob>('/counsellor/students/export', { responseType: 'blob' })
  const url = URL.createObjectURL(data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'my_students.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export async function uploadCounsellorStudentsExcel(file: File): Promise<CounsellorStudentsImportResult> {
  assertMaxUploadSize(file)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<CounsellorStudentsImportResult>('/counsellor/students/import', formData)
  return data!
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

export async function getStudentUniversityById<T = unknown>(studentUserId: string, universityId: string): Promise<T> {
  const { data } = await api.get<T>(`/counsellor/students/${studentUserId}/universities/${universityId}`)
  return data as T
}

export async function getStudentUniversityFlyers(studentUserId: string, universityId: string): Promise<import('@/types/university').UniversityFlyer[]> {
  const { data } = await api.get<import('@/types/university').UniversityFlyer[]>(`/counsellor/students/${studentUserId}/universities/${universityId}/flyers`)
  return data ?? []
}

export interface CounsellorStudentUniversitiesParams extends PaginationParams {
  country?: string
  city?: string
  hasScholarship?: boolean
  useProfileFilters?: boolean
}

export async function listStudentUniversities(
  studentUserId: string,
  params?: CounsellorStudentUniversitiesParams
): Promise<PaginatedResponse<UniversityListItem>> {
  const { data } = await api.get<PaginatedResponse<UniversityListItem>>(`/counsellor/students/${studentUserId}/universities`, { params })
  return data ?? { data: [], total: 0, page: 1 }
}

export async function listAllStudentsUniversities(
  params?: CounsellorStudentUniversitiesParams
): Promise<PaginatedResponse<UniversityListItem>> {
  const { data } = await api.get<PaginatedResponse<UniversityListItem>>(`/counsellor/students/all/universities`, { params })
  return data ?? { data: [], total: 0, page: 1 }
}

/** Search existing students (not in my school) for invite. */
export async function searchStudentsForInvite(params: { search: string; limit?: number }): Promise<{ data: Array<{ id: string; email: string; name: string }> }> {
  const { data } = await api.get('/counsellor/students/search-invite', { params })
  return data
}

/** Invite existing student to my school. Sends request; student must accept or decline. */
export async function inviteStudent(userId: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post('/counsellor/students/invite', { userId })
  return data
}

export interface CounsellorInvitationItem {
  id: string
  studentUserId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  respondedAt?: string
  studentEmail: string
  studentName: string
}

export async function listMyInvitations(params?: { status?: 'pending' | 'accepted' | 'declined'; page?: number; limit?: number }): Promise<{
  data: CounsellorInvitationItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const { data } = await api.get('/counsellor/invitations', { params })
  return data
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await api.post(`/counsellor/invitations/${invitationId}/cancel`)
}

export interface CounsellorStudentDocument {
  id: string
  type: string
  source?: 'upload' | 'editor'
  name?: string
  certificateType?: string
  score?: string
  fileUrl?: string
  previewImageUrl?: string
  canvasJson?: string
  pageFormat?: DocumentPageFormat
  width?: number
  height?: number
  editorVersion?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt?: string
  updatedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

export async function getStudentDocuments(studentUserId: string): Promise<CounsellorStudentDocument[]> {
  const { data } = await api.get<CounsellorStudentDocument[]>(`/counsellor/students/${studentUserId}/documents`)
  return data ?? []
}

export async function addStudentDocument(
  studentUserId: string,
  payload: {
    type: string
    source?: 'upload' | 'editor'
    fileUrl?: string
    name?: string
    certificateType?: string
    score?: string
    previewImageUrl?: string
    canvasJson?: string
    pageFormat?: DocumentPageFormat
    width?: number
    height?: number
    editorVersion?: string
  }
): Promise<CounsellorStudentDocument> {
  const { data } = await api.post<CounsellorStudentDocument>(`/counsellor/students/${studentUserId}/documents`, payload)
  return data
}

export async function updateStudentDocument(
  studentUserId: string,
  documentId: string,
  payload: {
    type?: string
    source?: 'upload' | 'editor'
    fileUrl?: string
    name?: string
    certificateType?: string
    score?: string
    previewImageUrl?: string
    canvasJson?: string
    pageFormat?: DocumentPageFormat
    width?: number
    height?: number
    editorVersion?: string
  }
): Promise<CounsellorStudentDocument> {
  const { data } = await api.patch<CounsellorStudentDocument>(`/counsellor/students/${studentUserId}/documents/${documentId}`, payload)
  return data
}

export async function deleteStudentDocument(studentUserId: string, documentId: string): Promise<void> {
  await api.delete(`/counsellor/students/${studentUserId}/documents/${documentId}`)
}
