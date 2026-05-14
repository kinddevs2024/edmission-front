import { api } from './api'
import { assertMaxUploadSize } from '@/services/upload'
import type { PaginationParams, PaginatedResponse } from '@/types/api'
import type {
  DocumentPageFormat,
  DocumentTemplate,
  RenderedTemplatePreview,
  UniversityDocumentSummary,
} from '@/types/documentModule'
import type { GlobalFaculty } from '@/types/university'

/** Backend GET /admin/dashboard returns this shape */
export interface AdminDashboardResponse {
  users: number
  universities: number
  pendingOffers: number
  pendingVerification: number
  pendingDocuments?: number
  subscriptionsByPlan?: Record<string, number>
  mrr?: number;
  telegramBot?: {
    isActive: boolean;
    lastPollTime: string | null;
    version: string;
    pollingInProgress: boolean;
  };

}

export interface AdminStats {
  studentsCount: number
  universitiesCount: number
  activeOffersCount: number
  pendingDocumentsCount: number
  healthStatus: 'ok' | 'degraded' | 'error'
  subscriptionsByPlan?: Record<string, number>
  mrr?: number
}

export interface AdminUser {
  id: string
  email: string
  role: string
  name?: string
  phone?: string
  schoolName?: string
  mustChangePassword?: boolean
  temporaryPassword?: string
  /** ISO date or empty when unknown */
  createdAt: string
  status: 'active' | 'suspended'
}

function normalizeAdminCreatedAt(raw: Record<string, unknown>): string {
  const c = raw.createdAt
  if (c == null || c === '') return ''
  return String(c)
}

export interface AdminUniversityProfile {
  id: string
  userId: string
  universityName: string
  tagline?: string
  establishedYear?: number
  studentCount?: number
  country?: string
  city?: string
  description?: string
  logoUrl?: string
  facultyCodes?: string[]
  facultyItems?: Record<string, string[]>
  targetStudentCountries?: string[]
  minLanguageLevel?: string
  tuitionPrice?: number
  rating?: number
  coverImageUrl?: string
  ieltsMinBand?: number
  gpaMinMode?: 'scale' | 'percent' | null
  gpaMinValue?: number | null
}

export interface AdminCounsellorProfile {
  id: string
  userId: string
  schoolName: string
  schoolDescription: string
  country: string
  city: string
  isPublic: boolean
}

export interface AdminCounsellorStudentsImportResult {
  created: number
  updated: number
  errors: Array<{ row: number; name: string; message: string }>
}

export interface CreateAdminUserPayload {
  role: 'student' | 'university' | 'university_multi_manager' | 'multi_university_admin' | 'admin' | 'school_counsellor' | 'counsellor_coordinator' | 'manager'
  email: string
  password?: string
  name?: string
}

export async function createUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
  const body: Record<string, unknown> = { role: payload.role, email: payload.email }
  if (payload.name != null) body.name = payload.name
  if (payload.password != null && payload.password.trim()) body.password = payload.password
  const { data } = await api.post<unknown>('/admin/users', body)
  const raw = (data ?? {}) as Record<string, unknown>
  return {
    id: String(raw.id ?? raw._id ?? ''),
    email: String(raw.email ?? ''),
    role: String(raw.role ?? ''),
    name: (raw.name as string | undefined) ?? undefined,
    phone: raw.phone != null ? String(raw.phone) : undefined,
    schoolName: raw.schoolName != null ? String(raw.schoolName) : undefined,
    mustChangePassword: Boolean(raw.mustChangePassword),
    temporaryPassword: raw.temporaryPassword != null ? String(raw.temporaryPassword) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    status: (raw.suspended ? 'suspended' : 'active') as 'active' | 'suspended',
  }
}

export interface VerificationItem {
  id: string
  universityId: string
  name: string
  email: string
  country?: string
  submittedAt: string
  documents?: { name: string; url: string }[]
}

/** Raw item from GET /admin/universities/verification */
interface VerificationItemRaw {
  id: string
  universityName?: string
  country?: string
  user?: { email?: string }
  documents?: Array<{ name?: string; url?: string }>
  createdAt?: string
}

export interface AuditLogEntry {
  id: string
  type: string
  userId?: string
  userEmail?: string
  payload?: Record<string, unknown>
  createdAt: string
}

export interface ServiceHealth {
  name: string
  status: 'up' | 'down'
  latency?: number
  message?: string
}

export interface ScholarshipSummaryItem {
  universityId: string
  universityName: string
  totalSlots: number
  usedSlots: number
  deadline?: string
}

export interface PendingDocumentItem {
  id: string
  type: string
  source?: 'upload' | 'editor'
  fileUrl?: string
  previewImageUrl?: string
  canvasJson?: string
  pageFormat?: DocumentPageFormat
  width?: number
  height?: number
  editorVersion?: string
  name?: string
  certificateType?: string
  score?: string
  status: string
  studentId: unknown
  studentName: string
  createdAt?: string
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
}

export type AdminDocumentFilter = 'pending' | 'approved' | 'rejected' | 'all'

export async function getAdminStudentDocuments(status: AdminDocumentFilter = 'pending'): Promise<PendingDocumentItem[]> {
  const { data } = await api.get<PendingDocumentItem[]>('/admin/documents', { params: { status } })
  return data ?? []
}

/** @deprecated use getAdminStudentDocuments('pending') */
export async function getPendingDocuments(): Promise<PendingDocumentItem[]> {
  return getAdminStudentDocuments('pending')
}

export async function reviewDocument(
  documentId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<void> {
  await api.patch(`/admin/documents/${documentId}/review`, { decision, rejectionReason })
}

export interface SystemSettings {
  requireAccountConfirmation: boolean
  requireEmailVerification: boolean
  maintenanceMode: boolean
}

export async function getSettings(): Promise<SystemSettings> {
  const { data } = await api.get<SystemSettings>('/admin/settings')
  return data ?? {
    requireAccountConfirmation: false,
    requireEmailVerification: false,
    maintenanceMode: false,
  }
}

export async function updateSettings(patch: Partial<SystemSettings>): Promise<SystemSettings> {
  const { data } = await api.patch<SystemSettings>('/admin/settings', patch)
  return data ?? patch as SystemSettings
}

export interface UniversityInterestAnalyticsItem {
  universityId: string
  universityName: string
  interestCount: number
  source: 'profile' | 'catalog'
}

export interface AdminAnalyticsOverview {
  from: string
  to: string
  totalVisitors: number
  universityVisitors: number
  studentVisitors: number
  registrations: number
}

export async function getUniversityInterestAnalytics(limit?: number): Promise<UniversityInterestAnalyticsItem[]> {
  const { data } = await api.get<UniversityInterestAnalyticsItem[]>('/admin/analytics/university-interests', {
    params: limit != null ? { limit } : undefined,
  })
  return Array.isArray(data) ? data : []
}

export async function getAdminAnalyticsOverview(params?: { from?: string; to?: string }): Promise<AdminAnalyticsOverview> {
  const { data } = await api.get<AdminAnalyticsOverview>('/admin/analytics/overview', { params })
  return data ?? {
    from: params?.from ?? '',
    to: params?.to ?? '',
    totalVisitors: 0,
    universityVisitors: 0,
    studentVisitors: 0,
    registrations: 0,
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminDashboardResponse>('/admin/dashboard')
  return {
    studentsCount: data?.users ?? 0,
    universitiesCount: data?.universities ?? 0,
    activeOffersCount: data?.pendingOffers ?? 0,
    pendingDocumentsCount: data?.pendingDocuments ?? 0,
    healthStatus: 'ok',
    subscriptionsByPlan: data?.subscriptionsByPlan,
    mrr: data?.mrr,
  }
}

/** Backend returns users with `suspended` (boolean); we normalize to `status` for UI. */
export async function getUsers(params?: PaginationParams & { status?: string; role?: string; search?: string }): Promise<PaginatedResponse<AdminUser>> {
  const res = await api.get<{ data?: Array<Record<string, unknown>>; total?: number; page?: number; limit?: number; totalPages?: number }>('/admin/users', { params })
  const rawList = res.data?.data ?? []
  const data: AdminUser[] = rawList.map((raw) => {
    const rec = raw as Record<string, unknown>
    return {
      id: String(rec.id ?? rec._id ?? ''),
      email: String(rec.email ?? ''),
      role: String(rec.role ?? ''),
      name: (rec.name as string | undefined) ?? undefined,
      phone: rec.phone != null ? String(rec.phone) : undefined,
      schoolName: rec.schoolName != null ? String(rec.schoolName) : undefined,
      mustChangePassword: Boolean(rec.mustChangePassword),
      temporaryPassword: rec.temporaryPassword != null ? String(rec.temporaryPassword) : undefined,
      createdAt: normalizeAdminCreatedAt(rec),
      status: (rec.suspended === true ? 'suspended' : 'active') as 'active' | 'suspended',
    }
  })
  return {
    data,
    total: res.data?.total ?? 0,
    page: res.data?.page ?? 1,
    limit: res.data?.limit ?? 20,
  }
}

export interface UpdateUserPayload {
  name?: string
  role?: 'student' | 'university' | 'university_multi_manager' | 'multi_university_admin' | 'admin' | 'school_counsellor' | 'counsellor_coordinator' | 'manager'
  emailVerified?: boolean
  suspended?: boolean
  managedUniversityUserIds?: string[]
  universityMultiManagerApproved?: boolean
}

export async function getAdminUser(userId: string): Promise<Record<string, unknown>> {
  const { data } = await api.get<Record<string, unknown>>(`/admin/users/${userId}`)
  return data ?? {}
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<AdminUser> {
  const { data } = await api.patch<Record<string, unknown>>(`/admin/users/${userId}`, payload)
  const raw = (data ?? {}) as Record<string, unknown>
  return {
    id: String(raw.id ?? raw._id ?? ''),
    email: String(raw.email ?? ''),
    role: String(raw.role ?? ''),
    name: (raw.name as string | undefined) ?? undefined,
    phone: raw.phone != null ? String(raw.phone) : undefined,
    schoolName: raw.schoolName != null ? String(raw.schoolName) : undefined,
    mustChangePassword: Boolean(raw.mustChangePassword),
    temporaryPassword: raw.temporaryPassword != null ? String(raw.temporaryPassword) : undefined,
    createdAt: normalizeAdminCreatedAt(raw),
    status: (raw.suspended ? 'suspended' : 'active') as 'active' | 'suspended',
  }
}

export async function suspendUser(userId: string): Promise<void> {
  await api.patch(`/admin/users/${userId}/suspend`, { suspend: true })
}

export async function unsuspendUser(userId: string): Promise<void> {
  await api.patch(`/admin/users/${userId}/suspend`, { suspend: false })
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/admin/users/${userId}`)
}

export async function resetUserPassword(userId: string, password: string): Promise<void> {
  await api.post(`/admin/users/${userId}/reset-password`, { password })
}

export async function downloadUsersTemplate(): Promise<void> {
  const { data } = await api.get<Blob>('/admin/users/template', { responseType: 'blob' })
  const url = URL.createObjectURL(data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'users_template.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadAllUsersExcel(): Promise<void> {
  const { data } = await api.get<Blob>('/admin/users/export', { responseType: 'blob' })
  const url = URL.createObjectURL(data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'users_export.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export interface UsersExcelUserPayload {
  email: string
  generatedEmail?: boolean
  role: string
  name: string
  firstName: string
  lastName: string
  phone?: string
  language?: string
  emailVerified?: boolean
  suspended?: boolean
  country?: string
  city?: string
  gradeLevel?: string
  gpa?: number
  schoolName?: string
  graduationYear?: number
  preferredCountries?: string[]
  interestedFaculties?: string[]
  counsellorUserId?: string
  counsellorEmail?: string
  managedUniversityUserIds?: string[]
  universityMultiManagerApproved?: boolean
}

export interface UsersImportPreviewItem {
  row: number
  sourceId?: string
  existingId?: string
  email: string
  name: string
  action: 'create' | 'update'
  incoming: UsersExcelUserPayload
  current?: UsersExcelUserPayload
  changes: Array<{ field: string; before: string; after: string }>
}

export interface UsersImportPreviewResult {
  items: UsersImportPreviewItem[]
  errors: Array<{ row: number; name: string; message: string }>
  summary: {
    total: number
    creates: number
    updates: number
    errors: number
  }
}

export interface UsersImportResult {
  created: number
  updated: number
  errors: Array<{ row: number; name: string; message: string }>
}

export async function previewUsersExcel(file: File): Promise<UsersImportPreviewResult> {
  assertMaxUploadSize(file)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<UsersImportPreviewResult>('/admin/users/import/preview', formData)
  return data!
}

export async function uploadUsersExcel(file: File): Promise<UsersImportResult> {
  assertMaxUploadSize(file)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<UsersImportResult>('/admin/users/import', formData)
  return data!
}

export async function getUniversityProfileByUser(userId: string): Promise<AdminUniversityProfile> {
  const { data } = await api.get<Record<string, unknown>>(`/admin/users/${userId}/university-profile`)
  const raw = data ?? {}
  const gpaMode = raw.gpaMinMode != null ? String(raw.gpaMinMode) : ''
  return {
    id: String(raw.id ?? raw._id ?? ''),
    userId: String(raw.userId ?? ''),
    universityName: String(raw.universityName ?? ''),
    tagline: raw.tagline != null ? String(raw.tagline) : undefined,
    establishedYear: raw.establishedYear != null ? Number(raw.establishedYear) : undefined,
    studentCount: raw.studentCount != null ? Number(raw.studentCount) : undefined,
    country: raw.country != null ? String(raw.country) : undefined,
    city: raw.city != null ? String(raw.city) : undefined,
    description: raw.description != null ? String(raw.description) : undefined,
    logoUrl: raw.logoUrl != null ? String(raw.logoUrl) : undefined,
    facultyCodes: Array.isArray(raw.facultyCodes) ? raw.facultyCodes.map((x) => String(x)) : [],
    facultyItems: raw.facultyItems && typeof raw.facultyItems === 'object' && !Array.isArray(raw.facultyItems)
      ? raw.facultyItems as Record<string, string[]>
      : undefined,
    targetStudentCountries: Array.isArray(raw.targetStudentCountries) ? raw.targetStudentCountries.map((x) => String(x)) : [],
    minLanguageLevel: raw.minLanguageLevel != null ? String(raw.minLanguageLevel) : undefined,
    tuitionPrice: raw.tuitionPrice != null ? Number(raw.tuitionPrice) : undefined,
    rating: raw.rating != null ? Number(raw.rating) : undefined,
    coverImageUrl: raw.coverImageUrl != null ? String(raw.coverImageUrl) : undefined,
    ieltsMinBand: raw.ieltsMinBand != null ? Number(raw.ieltsMinBand) : undefined,
    gpaMinMode: gpaMode === 'scale' || gpaMode === 'percent' ? gpaMode : raw.gpaMinMode === null ? null : undefined,
    gpaMinValue: raw.gpaMinValue != null ? Number(raw.gpaMinValue) : raw.gpaMinValue === null ? null : undefined,
  }
}

export async function updateUniversityProfileByUser(
  userId: string,
  payload: {
    universityName: string
    tagline?: string
    establishedYear?: number
    studentCount?: number
    country?: string
    city?: string
    description?: string
    logoUrl?: string
    coverImageUrl?: string
    facultyCodes?: string[]
    facultyItems?: Record<string, string[]>
    targetStudentCountries?: string[]
    minLanguageLevel?: string
    tuitionPrice?: number
    rating?: number
    ieltsMinBand?: number | null
    gpaMinMode?: 'scale' | 'percent' | null
    gpaMinValue?: number | null
  }
): Promise<AdminUniversityProfile> {
  const { data } = await api.patch<Record<string, unknown>>(`/admin/users/${userId}/university-profile`, payload)
  const raw = data ?? {}
  const gpaMode = raw.gpaMinMode != null ? String(raw.gpaMinMode) : ''
  return {
    id: String(raw.id ?? raw._id ?? ''),
    userId: String(raw.userId ?? ''),
    universityName: String(raw.universityName ?? ''),
    tagline: raw.tagline != null ? String(raw.tagline) : undefined,
    establishedYear: raw.establishedYear != null ? Number(raw.establishedYear) : undefined,
    studentCount: raw.studentCount != null ? Number(raw.studentCount) : undefined,
    country: raw.country != null ? String(raw.country) : undefined,
    city: raw.city != null ? String(raw.city) : undefined,
    description: raw.description != null ? String(raw.description) : undefined,
    logoUrl: raw.logoUrl != null ? String(raw.logoUrl) : undefined,
    facultyCodes: Array.isArray(raw.facultyCodes) ? raw.facultyCodes.map((x) => String(x)) : [],
    facultyItems: raw.facultyItems && typeof raw.facultyItems === 'object' && !Array.isArray(raw.facultyItems)
      ? raw.facultyItems as Record<string, string[]>
      : undefined,
    targetStudentCountries: Array.isArray(raw.targetStudentCountries) ? raw.targetStudentCountries.map((x) => String(x)) : [],
    minLanguageLevel: raw.minLanguageLevel != null ? String(raw.minLanguageLevel) : undefined,
    tuitionPrice: raw.tuitionPrice != null ? Number(raw.tuitionPrice) : undefined,
    rating: raw.rating != null ? Number(raw.rating) : undefined,
    coverImageUrl: raw.coverImageUrl != null ? String(raw.coverImageUrl) : undefined,
    ieltsMinBand: raw.ieltsMinBand != null ? Number(raw.ieltsMinBand) : undefined,
    gpaMinMode: gpaMode === 'scale' || gpaMode === 'percent' ? gpaMode : raw.gpaMinMode === null ? null : undefined,
    gpaMinValue: raw.gpaMinValue != null ? Number(raw.gpaMinValue) : raw.gpaMinValue === null ? null : undefined,
  }
}

export async function getStudentProfileByUser(userId: string): Promise<Record<string, unknown>> {
  const { data } = await api.get<Record<string, unknown>>(`/admin/users/${userId}/student-profile`)
  return data ?? {}
}

export async function updateStudentProfileByUser(userId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await api.patch<Record<string, unknown>>(`/admin/users/${userId}/student-profile`, patch)
  return data ?? {}
}

function normalizeCounsellorProfile(raw: Record<string, unknown>): AdminCounsellorProfile {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    userId: String(raw.userId ?? ''),
    schoolName: String(raw.schoolName ?? ''),
    schoolDescription: String(raw.schoolDescription ?? ''),
    country: String(raw.country ?? ''),
    city: String(raw.city ?? ''),
    isPublic: raw.isPublic == null ? true : Boolean(raw.isPublic),
  }
}

export async function getCounsellorProfileByUser(userId: string): Promise<AdminCounsellorProfile> {
  const { data } = await api.get<Record<string, unknown>>(`/admin/users/${userId}/counsellor-profile`)
  return normalizeCounsellorProfile(data ?? {})
}

export async function updateCounsellorProfileByUser(
  userId: string,
  payload: Pick<AdminCounsellorProfile, 'schoolName' | 'schoolDescription' | 'country' | 'city' | 'isPublic'>
): Promise<AdminCounsellorProfile> {
  const { data } = await api.patch<Record<string, unknown>>(`/admin/users/${userId}/counsellor-profile`, payload)
  return normalizeCounsellorProfile(data ?? {})
}

export async function downloadCounsellorStudentsExcelByUser(userId: string): Promise<void> {
  const { data } = await api.get<Blob>(`/admin/users/${userId}/counsellor-students/export`, { responseType: 'blob' })
  const url = URL.createObjectURL(data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'counsellor_students.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export async function uploadCounsellorStudentsExcelByUser(userId: string, file: File): Promise<AdminCounsellorStudentsImportResult> {
  assertMaxUploadSize(file)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<AdminCounsellorStudentsImportResult>(`/admin/users/${userId}/counsellor-students/import`, formData)
  return data!
}

export async function getStudentDocumentsByUser(studentUserId: string): Promise<Array<Record<string, unknown>>> {
  const { data } = await api.get<Array<Record<string, unknown>>>(`/admin/users/${studentUserId}/student-documents`)
  return data ?? []
}

export async function addStudentDocumentByUser(
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
): Promise<Record<string, unknown>> {
  const { data } = await api.post<Record<string, unknown>>(`/admin/users/${studentUserId}/student-documents`, payload)
  return data ?? {}
}

export async function deleteStudentDocumentByUser(studentUserId: string, documentId: string): Promise<void> {
  await api.delete(`/admin/users/${studentUserId}/student-documents/${documentId}`)
}

export interface AdminOffer {
  id: string
  studentId: string
  universityId: string
  scholarshipId?: string | null
  coveragePercent: number
  status: 'pending' | 'accepted' | 'declined'
  createdAt?: string
}

export async function getOffers(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<AdminOffer>> {
  const { data } = await api.get<PaginatedResponse<AdminOffer>>('/admin/offers', { params })
  return data
}

export async function updateOfferStatus(offerId: string, status: 'pending' | 'accepted' | 'declined'): Promise<void> {
  await api.patch(`/admin/offers/${offerId}/status`, { status })
}

export interface AdminInterest {
  id: string
  studentId: string
  universityId: string
  studentName?: string
  universityName?: string
  status: string
  source?: 'profile' | 'catalog'
  chatId?: string
  chatCreatedAt?: string
  createdAt?: string
}

export async function getInterests(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<AdminInterest>> {
  const { data } = await api.get<PaginatedResponse<AdminInterest>>('/admin/interests', { params })
  return data
}

export async function updateInterestStatus(interestId: string, status: string): Promise<void> {
  await api.patch(`/admin/interests/${interestId}/status`, { status })
}

export async function openInterestChat(interestId: string): Promise<{ chatId: string; created: boolean }> {
  const { data } = await api.post<{ chatId: string; created: boolean }>(`/admin/interests/${interestId}/open-chat`)
  return data
}

export interface AdminChat {
  id: string
  studentId: string
  universityId: string
  universityName?: string
  studentName?: string
  universityEmail?: string
  studentEmail?: string
  /** StudentProfile document id (for offers / documents). */
  studentProfileId?: string
  /** University account User id (for admin proxy APIs). */
  universityUserId?: string
  createdAt?: string
  updatedAt?: string
}

export interface AdminChatsResponse extends PaginatedResponse<AdminChat> {
  universities?: { id: string; name: string }[]
}

export async function getChats(params?: PaginationParams & { universityId?: string }): Promise<AdminChatsResponse> {
  const { data } = await api.get<AdminChatsResponse>('/admin/chats', { params })
  return data
}

export interface AdminChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName?: string
  senderEmail?: string
  senderRole?: string
  sentByAdmin?: boolean
  attachmentUrl?: string
  metadata?: Record<string, unknown>
  type: string
  message: string
  createdAt: string
}

export async function getChatMessages(chatId: string, params?: { limit?: number }) {
  const { data } = await api.get<{ chat: AdminChat; messages: AdminChatMessage[] }>(`/admin/chats/${chatId}/messages`, { params })
  return data
}

function adminUniversityAccountBase(universityUserId: string) {
  return `/admin/university-accounts/${universityUserId}`
}

export async function adminUniversityGetDocumentTemplates(
  universityUserId: string,
  params?: { type?: 'offer' | 'scholarship'; status?: 'draft' | 'active' | 'archived' }
): Promise<DocumentTemplate[]> {
  const { data } = await api.get<DocumentTemplate[]>(`${adminUniversityAccountBase(universityUserId)}/document-templates`, { params })
  return data ?? []
}

export async function adminUniversityGetDocumentTemplate(universityUserId: string, templateId: string): Promise<DocumentTemplate> {
  const { data } = await api.get<DocumentTemplate>(`${adminUniversityAccountBase(universityUserId)}/document-templates/${templateId}`)
  return data!
}

export async function adminUniversityCreateDocumentTemplate(
  universityUserId: string,
  payload: Partial<DocumentTemplate> & { type: 'offer' | 'scholarship'; name: string }
): Promise<DocumentTemplate> {
  const { data } = await api.post<DocumentTemplate>(`${adminUniversityAccountBase(universityUserId)}/document-templates`, payload)
  return data!
}

export async function adminUniversityUpdateDocumentTemplate(
  universityUserId: string,
  templateId: string,
  payload: Partial<DocumentTemplate>
): Promise<DocumentTemplate> {
  const { data } = await api.patch<DocumentTemplate>(
    `${adminUniversityAccountBase(universityUserId)}/document-templates/${templateId}`,
    payload
  )
  return data!
}

export async function adminUniversityDeleteDocumentTemplate(universityUserId: string, templateId: string): Promise<void> {
  await api.delete(`${adminUniversityAccountBase(universityUserId)}/document-templates/${templateId}`)
}

export async function adminUniversityDuplicateDocumentTemplate(universityUserId: string, templateId: string): Promise<DocumentTemplate> {
  const { data } = await api.post<DocumentTemplate>(
    `${adminUniversityAccountBase(universityUserId)}/document-templates/${templateId}/duplicate`
  )
  return data!
}

export async function adminUniversityRenderDocumentTemplatePreview(
  universityUserId: string,
  templateId: string,
  payload?: { studentId?: string; acceptDeadline?: string; universityMessage?: string; documentData?: Record<string, unknown> }
): Promise<RenderedTemplatePreview> {
  const { data } = await api.post<RenderedTemplatePreview>(
    `${adminUniversityAccountBase(universityUserId)}/document-templates/${templateId}/render-preview`,
    payload ?? {}
  )
  return data!
}

export async function adminUniversityListIssuedDocuments(
  universityUserId: string,
  params?: { type?: 'offer' | 'scholarship'; status?: UniversityDocumentSummary['status'] }
): Promise<UniversityDocumentSummary[]> {
  const { data } = await api.get<UniversityDocumentSummary[]>(`${adminUniversityAccountBase(universityUserId)}/issued-documents`, { params })
  return data ?? []
}

export async function adminUniversitySendIssuedDocument(
  universityUserId: string,
  payload: {
    studentId: string
    chatId?: string
    templateId: string
    type: 'offer' | 'scholarship'
    acceptDeadline?: string
    universityMessage?: string
    title?: string
    documentData?: Record<string, unknown>
  }
): Promise<UniversityDocumentSummary> {
  const { data } = await api.post<UniversityDocumentSummary>(
    `${adminUniversityAccountBase(universityUserId)}/issued-documents/send`,
    payload
  )
  return data!
}

export async function adminUniversityGetIssuedDocument(universityUserId: string, documentId: string): Promise<UniversityDocumentSummary> {
  const { data } = await api.get<UniversityDocumentSummary>(
    `${adminUniversityAccountBase(universityUserId)}/issued-documents/${documentId}`
  )
  return data!
}

export async function adminUniversityRevokeIssuedDocument(universityUserId: string, documentId: string): Promise<UniversityDocumentSummary> {
  const { data } = await api.post<UniversityDocumentSummary>(
    `${adminUniversityAccountBase(universityUserId)}/issued-documents/${documentId}/revoke`
  )
  return data!
}

export async function adminUniversityDeleteIssuedDocument(universityUserId: string, documentId: string): Promise<void> {
  await api.delete(`${adminUniversityAccountBase(universityUserId)}/issued-documents/${documentId}`)
}

export async function adminUniversityGetScholarshipsForAccount(universityUserId: string): Promise<Array<Record<string, unknown> & { id?: string }>> {
  const { data } = await api.get<Array<Record<string, unknown> & { id?: string }>>(
    `${adminUniversityAccountBase(universityUserId)}/scholarships`
  )
  return data ?? []
}

export async function adminUniversityListOfferTemplates(universityUserId: string): Promise<Array<Record<string, unknown> & { id?: string }>> {
  const { data } = await api.get<Array<Record<string, unknown> & { id?: string }>>(
    `${adminUniversityAccountBase(universityUserId)}/offer-templates`
  )
  return data ?? []
}

export async function adminUniversityCreateOffer(
  universityUserId: string,
  payload: {
    studentId: string
    scholarshipId?: string
    coveragePercent: number
    deadline?: string
    certificateTemplateId?: string
    certificateData?: Record<string, string>
  }
): Promise<unknown> {
  const { data } = await api.post(`${adminUniversityAccountBase(universityUserId)}/offers`, payload)
  return data
}

export async function sendAdminChatMessage(
  chatId: string,
  payload: string | {
    text: string
    attachmentUrl?: string
    metadata?: Record<string, unknown>
    actingUniversityUserId?: string
  }
): Promise<AdminChatMessage> {
  const body = typeof payload === 'string' ? { text: payload } : payload
  const { data } = await api.post<AdminChatMessage>(`/admin/chats/${chatId}/messages`, body)
  return data
}

export async function deleteAdminChat(chatId: string): Promise<void> {
  await api.delete(`/admin/chats/${chatId}`)
}

export async function getVerificationQueue(): Promise<VerificationItem[]> {
  const { data } = await api.get<VerificationItemRaw[]>('/admin/universities/verification')
  return (data ?? []).map((u) => ({
    id: u.id,
    universityId: u.id,
    name: u.universityName ?? '',
    email: (u.user as { email?: string })?.email ?? '',
    country: u.country,
    submittedAt: (u as { createdAt?: string }).createdAt ?? new Date().toISOString(),
    documents: (u.documents ?? []).map((d: { id?: string; name?: string; url?: string }) => ({ name: d.name ?? '', url: d.url ?? '' })),
  }))
}

export async function approveUniversity(universityId: string, _comment?: string): Promise<void> {
  await api.post(`/admin/universities/${universityId}/verify`, { approve: true })
}

export async function rejectUniversity(universityId: string, _comment?: string): Promise<void> {
  await api.post(`/admin/universities/${universityId}/verify`, { approve: false })
}

// ——— University catalog (for registration flow) ———

export interface AdminCatalogUniversity {
  id: string
  name: string
  universityName?: string
  country?: string
  city?: string
  description?: string
  rating?: number
  logoUrl?: string
  tagline?: string
  establishedYear?: number
  studentCount?: number
  linkedUniversityUserId?: string
  linkedUniversityProfileId?: string
  facultyCodes?: string[]
  facultyItems?: Record<string, string[]>
  targetStudentCountries?: string[]
  minLanguageLevel?: string
  tuitionPrice?: number
}

export interface AdminCatalogListResponse {
  data: AdminCatalogUniversity[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getAdminCatalogUniversities(params?: { page?: number; limit?: number; search?: string }): Promise<AdminCatalogListResponse> {
  const { data } = await api.get<AdminCatalogListResponse>('/admin/universities', { params })
  return data ?? { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
}

export async function createCatalogUniversity(body: Record<string, unknown>): Promise<AdminCatalogUniversity> {
  const { data } = await api.post<AdminCatalogUniversity>('/admin/universities', body)
  return data!
}

export async function getCatalogUniversity(id: string): Promise<AdminCatalogUniversity & { programs?: unknown[]; scholarships?: unknown[] }> {
  const { data } = await api.get<AdminCatalogUniversity & { programs?: unknown[]; scholarships?: unknown[] }>(`/admin/universities/${id}`)
  return data!
}

export async function updateCatalogUniversity(id: string, body: Record<string, unknown>): Promise<AdminCatalogUniversity> {
  const { data } = await api.patch<AdminCatalogUniversity>(`/admin/universities/${id}`, body)
  return data!
}

export async function deleteCatalogUniversity(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<{ deleted: boolean }>(`/admin/universities/${id}`)
  return data!
}

export async function getAdminGlobalFaculties(): Promise<GlobalFaculty[]> {
  const { data } = await api.get<GlobalFaculty[]>('/admin/global-faculties')
  return data ?? []
}

export async function createAdminGlobalFaculty(payload: { name: string; items?: string[]; order?: number }): Promise<GlobalFaculty> {
  const { data } = await api.post<GlobalFaculty>('/admin/global-faculties', payload)
  return data!
}

export async function updateAdminGlobalFaculty(id: string, payload: { name?: string; items?: string[]; order?: number }): Promise<GlobalFaculty> {
  const { data } = await api.patch<GlobalFaculty>(`/admin/global-faculties/${id}`, payload)
  return data!
}

export async function deleteAdminGlobalFaculty(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<{ deleted: boolean }>(`/admin/global-faculties/${id}`)
  return data ?? { deleted: true }
}

/** Download universities Excel template (triggers file save in browser). */
export async function downloadUniversitiesTemplate(): Promise<void> {
  const { data } = await api.get<Blob>('/admin/universities/template', { responseType: 'blob' })
  const url = URL.createObjectURL(data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'universities_template.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadAllUniversitiesExcel(): Promise<void> {
  const { data } = await api.get<Blob>('/admin/universities/export', { responseType: 'blob' })
  const url = URL.createObjectURL(data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'universities_export.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export interface UniversitiesExcelProgram {
  name: string
  degreeLevel?: string
  field?: string
  durationYears?: number
  tuitionFee?: number
  language?: string
  entryRequirements?: string
}

export interface UniversitiesExcelScholarship {
  name: string
  coveragePercent: number
  maxSlots: number
  deadline?: string
  eligibility?: string
}

export interface UniversitiesExcelCustomFaculty {
  name: string
  description?: string
  items?: string[]
  order?: number
}

export interface UniversitiesExcelDocument {
  documentType: string
  fileUrl: string
  status?: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface UniversitiesExcelUniversityPayload {
  universityName: string
  tagline?: string
  establishedYear?: number
  studentCount?: number
  country?: string
  city?: string
  description?: string
  rating?: number
  logoUrl?: string
  facultyCodes?: string[]
  facultyItems?: Record<string, string[]>
  targetStudentCountries?: string[]
  minLanguageLevel?: string
  tuitionPrice?: number
  programs?: UniversitiesExcelProgram[]
  scholarships?: UniversitiesExcelScholarship[]
  customFaculties?: UniversitiesExcelCustomFaculty[]
  documents?: UniversitiesExcelDocument[]
}

export interface UniversitiesImportPreviewItem {
  row: number
  sourceId?: string
  existingId?: string
  universityName: string
  linkedProfileId?: string
  action: 'create' | 'update'
  incoming: UniversitiesExcelUniversityPayload
  current?: UniversitiesExcelUniversityPayload
  changes: Array<{ field: string; before: string; after: string }>
  sections: {
    programsChanged: boolean
    scholarshipsChanged: boolean
    customFacultiesChanged: boolean
    documentsChanged: boolean
  }
}

export interface UniversitiesImportPreviewResult {
  items: UniversitiesImportPreviewItem[]
  errors: Array<{ row: number; name: string; message: string }>
  summary: {
    total: number
    creates: number
    updates: number
    errors: number
  }
}

export interface UniversitiesImportResult {
  created: number
  updated: number
  errors: Array<{ row: number; name: string; message: string }>
}

export async function previewUniversitiesExcel(file: File): Promise<UniversitiesImportPreviewResult> {
  assertMaxUploadSize(file)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<UniversitiesImportPreviewResult>('/admin/universities/import/preview', formData)
  return data!
}

/** Upload Excel file to import universities after preview confirmation. */
export async function uploadUniversitiesExcel(file: File): Promise<UniversitiesImportResult> {
  assertMaxUploadSize(file)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<UniversitiesImportResult>('/admin/universities/import', formData)
  return data!
}

// ——— University verification requests (catalog → profile) ———

export interface UniversityVerificationRequestItem {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt?: string
  university?: { name?: string; country?: string; city?: string }
  userEmail?: string
}

export async function getUniversityVerificationRequests(params?: { status?: string }): Promise<UniversityVerificationRequestItem[]> {
  const { data } = await api.get<UniversityVerificationRequestItem[]>('/admin/university-requests', { params })
  return data ?? []
}

export async function approveUniversityRequest(requestId: string): Promise<{ approved: boolean; profileId: string }> {
  const { data } = await api.post<{ approved: boolean; profileId: string }>(`/admin/university-requests/${requestId}/approve`)
  return data ?? { approved: true, profileId: '' }
}

export async function rejectUniversityRequest(requestId: string): Promise<{ rejected: boolean }> {
  const { data } = await api.post<{ rejected: boolean }>(`/admin/university-requests/${requestId}/reject`)
  return data ?? { rejected: true }
}

export async function getLogs(params?: PaginationParams & { type?: string; userId?: string; from?: string; to?: string }): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await api.get<PaginatedResponse<AuditLogEntry>>('/admin/logs', { params })
  return data
}

export async function getHealth(): Promise<{ status: string; services: ServiceHealth[] }> {
  const { data } = await api.get<{ status: string; services: ServiceHealth[] }>('/admin/health')
  return data
}

// ——— Investors ———

export interface InvestorItem {
  id: string
  name: string
  logoUrl?: string
  websiteUrl?: string
  description?: string
  order?: number
}

export async function getInvestors(): Promise<InvestorItem[]> {
  const { data } = await api.get<InvestorItem[]>('/admin/investors')
  return data ?? []
}

export async function createInvestor(payload: { name: string; logoUrl?: string; websiteUrl?: string; description?: string; order?: number }): Promise<InvestorItem> {
  const { data } = await api.post<InvestorItem>('/admin/investors', payload)
  return data!
}

export async function deleteInvestor(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<{ deleted: boolean }>(`/admin/investors/${id}`)
  return data ?? { deleted: true }
}

export interface LandingCertificateItem {
  id: string
  type: 'university' | 'student'
  title: string
  imageUrl: string
  order?: number
}

export async function getLandingCertificates(): Promise<LandingCertificateItem[]> {
  const { data } = await api.get<LandingCertificateItem[]>('/admin/landing-certificates')
  return data ?? []
}

export async function createLandingCertificate(payload: { type: 'university' | 'student'; title: string; imageUrl: string; order?: number }): Promise<LandingCertificateItem> {
  const { data } = await api.post<LandingCertificateItem>('/admin/landing-certificates', payload)
  return data!
}

export async function updateLandingCertificate(id: string, payload: { type?: 'university' | 'student'; title?: string; imageUrl?: string; order?: number }): Promise<LandingCertificateItem> {
  const { data } = await api.patch<LandingCertificateItem>(`/admin/landing-certificates/${id}`, payload)
  return data!
}

export async function deleteLandingCertificate(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<{ deleted: boolean }>(`/admin/landing-certificates/${id}`)
  return data ?? { deleted: true }
}

export async function getScholarshipsSummary(): Promise<ScholarshipSummaryItem[]> {
  const { data } = await api.get<unknown>('/admin/scholarships')
  const list: Record<string, unknown>[] = Array.isArray(data) ? data : []
  return list.map((s) => {
    const maxSlots = Number(s.maxSlots ?? 0)
    const remainingSlots = Number(s.remainingSlots ?? 0)
    return {
      universityId: String((s.university as { _id?: string })?._id ?? s.universityId ?? ''),
      universityName: (s.university as { universityName?: string })?.universityName ?? String(s.universityName ?? ''),
      totalSlots: maxSlots,
      usedSlots: Number(s.usedSlots ?? maxSlots - remainingSlots),
      deadline: s.deadline as string | undefined,
    }
  })
}
