import { api } from './api'
import type { PaginationParams, PaginatedResponse } from '@/types/api'

/** Backend GET /admin/dashboard returns this shape */
export interface AdminDashboardResponse {
  users: number
  universities: number
  pendingOffers: number
  pendingVerification: number
  subscriptionsByPlan?: Record<string, number>
  mrr?: number
}

export interface AdminStats {
  studentsCount: number
  universitiesCount: number
  activeOffersCount: number
  healthStatus: 'ok' | 'degraded' | 'error'
  subscriptionsByPlan?: Record<string, number>
  mrr?: number
}

export interface AdminUser {
  id: string
  email: string
  role: string
  name?: string
  createdAt: string
  status: 'active' | 'suspended'
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
  targetStudentCountries?: string[]
}

export interface CreateAdminUserPayload {
  role: 'student' | 'university' | 'admin'
  email: string
  password: string
  name?: string
}

export async function createUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
  const { data } = await api.post<unknown>('/admin/users', payload)
  const raw = (data ?? {}) as Record<string, unknown>
  return {
    id: String(raw.id ?? raw._id ?? ''),
    email: String(raw.email ?? ''),
    role: String(raw.role ?? ''),
    name: (raw.name as string | undefined) ?? undefined,
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
  fileUrl: string
  status: string
  studentId: unknown
  studentName: string
  createdAt?: string
}

export async function getPendingDocuments(): Promise<PendingDocumentItem[]> {
  const { data } = await api.get<PendingDocumentItem[]>('/admin/documents/pending')
  return data ?? []
}

export async function reviewDocument(
  documentId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<void> {
  await api.patch(`/admin/documents/${documentId}/review`, { decision, rejectionReason })
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminDashboardResponse>('/admin/dashboard')
  return {
    studentsCount: data?.users ?? 0,
    universitiesCount: data?.universities ?? 0,
    activeOffersCount: data?.pendingOffers ?? 0,
    healthStatus: 'ok',
    subscriptionsByPlan: data?.subscriptionsByPlan,
    mrr: data?.mrr,
  }
}

/** Backend returns users with `suspended` (boolean); we normalize to `status` for UI. */
export async function getUsers(params?: PaginationParams & { status?: string; role?: string }): Promise<PaginatedResponse<AdminUser>> {
  const res = await api.get<{ data?: Array<Record<string, unknown>>; total?: number; page?: number; limit?: number; totalPages?: number }>('/admin/users', { params })
  const rawList = res.data?.data ?? []
  const data: AdminUser[] = rawList.map((raw) => ({
    id: String(raw.id ?? raw._id ?? ''),
    email: String(raw.email ?? ''),
    role: String(raw.role ?? ''),
    name: (raw.name as string | undefined) ?? undefined,
    createdAt: raw.createdAt != null ? String(raw.createdAt) : new Date().toISOString(),
    status: (raw.suspended === true ? 'suspended' : 'active') as 'active' | 'suspended',
  }))
  return {
    data,
    total: res.data?.total ?? 0,
    page: res.data?.page ?? 1,
    limit: res.data?.limit ?? 20,
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

export async function getUniversityProfileByUser(userId: string): Promise<AdminUniversityProfile> {
  const { data } = await api.get<Record<string, unknown>>(`/admin/users/${userId}/university-profile`)
  const raw = data ?? {}
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
    targetStudentCountries: Array.isArray(raw.targetStudentCountries) ? raw.targetStudentCountries.map((x) => String(x)) : [],
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
    facultyCodes?: string[]
    targetStudentCountries?: string[]
  }
): Promise<AdminUniversityProfile> {
  const { data } = await api.patch<Record<string, unknown>>(`/admin/users/${userId}/university-profile`, payload)
  const raw = data ?? {}
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
    targetStudentCountries: Array.isArray(raw.targetStudentCountries) ? raw.targetStudentCountries.map((x) => String(x)) : [],
  }
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
  status: string
  createdAt?: string
}

export async function getInterests(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<AdminInterest>> {
  const { data } = await api.get<PaginatedResponse<AdminInterest>>('/admin/interests', { params })
  return data
}

export async function updateInterestStatus(interestId: string, status: string): Promise<void> {
  await api.patch(`/admin/interests/${interestId}/status`, { status })
}

export interface AdminChat {
  id: string
  studentId: string
  universityId: string
  createdAt?: string
  updatedAt?: string
}

export async function getChats(params?: PaginationParams): Promise<PaginatedResponse<AdminChat>> {
  const { data } = await api.get<PaginatedResponse<AdminChat>>('/admin/chats', { params })
  return data
}

export interface AdminChatMessage {
  id: string
  chatId: string
  senderId: string
  type: string
  message: string
  createdAt: string
}

export async function getChatMessages(chatId: string, params?: { limit?: number }) {
  const { data } = await api.get<{ chat: AdminChat; messages: AdminChatMessage[] }>(`/admin/chats/${chatId}/messages`, { params })
  return data
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
  logoUrl?: string
  tagline?: string
  establishedYear?: number
  studentCount?: number
  facultyCodes?: string[]
  targetStudentCountries?: string[]
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
