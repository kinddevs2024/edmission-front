import { api } from './api'
import type { PaginationParams, PaginatedResponse } from '@/types/api'

/** Backend GET /admin/dashboard returns this shape */
export interface AdminDashboardResponse {
  users: number
  universities: number
  pendingOffers: number
  pendingVerification: number
}

export interface AdminStats {
  studentsCount: number
  universitiesCount: number
  activeOffersCount: number
  healthStatus: 'ok' | 'degraded' | 'error'
}

export interface AdminUser {
  id: string
  email: string
  role: string
  name?: string
  createdAt: string
  status: 'active' | 'suspended'
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

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminDashboardResponse>('/admin/dashboard')
  return {
    studentsCount: data?.users ?? 0,
    universitiesCount: data?.universities ?? 0,
    activeOffersCount: data?.pendingOffers ?? 0,
    healthStatus: 'ok',
  }
}

export async function getUsers(params?: PaginationParams & { status?: string; role?: string }): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await api.get<PaginatedResponse<AdminUser>>('/admin/users', { params })
  return data
}

export async function suspendUser(userId: string): Promise<void> {
  await api.patch(`/admin/users/${userId}/suspend`, { suspend: true })
}

export async function unsuspendUser(userId: string): Promise<void> {
  await api.patch(`/admin/users/${userId}/suspend`, { suspend: false })
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

export async function getLogs(params?: PaginationParams & { type?: string; userId?: string; from?: string; to?: string }): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await api.get<PaginatedResponse<AuditLogEntry>>('/admin/logs', { params })
  return data
}

export async function getHealth(): Promise<{ status: string; services: ServiceHealth[] }> {
  const { data } = await api.get<{ status: string; services: ServiceHealth[] }>('/admin/health')
  return data
}

export async function getScholarshipsSummary(): Promise<ScholarshipSummaryItem[]> {
  const { data } = await api.get<ScholarshipSummaryItem[] | Array<Record<string, unknown>>>('/admin/scholarships')
  const list = data ?? []
  return list.map((s: Record<string, unknown>) => ({
    universityId: String((s.university as { _id?: string })?._id ?? s.universityId ?? ''),
    universityName: (s.university as { universityName?: string })?.universityName ?? String(s.universityName ?? ''),
    totalSlots: Number(s.maxSlots ?? 0),
    usedSlots: Number(s.usedSlots ?? (s.maxSlots ?? 0) - (s.remainingSlots ?? 0)),
    deadline: s.deadline as string | undefined,
  }))
}
