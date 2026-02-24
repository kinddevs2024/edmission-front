import { api } from './api'
import type { PaginationParams, PaginatedResponse } from '@/types/api'

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
  const { data } = await api.get<AdminStats>('/admin/stats')
  return data
}

export async function getUsers(params?: PaginationParams & { status?: string; role?: string }): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await api.get<PaginatedResponse<AdminUser>>('/admin/users', { params })
  return data
}

export async function suspendUser(userId: string): Promise<void> {
  await api.post(`/admin/users/${userId}/suspend`)
}

export async function unsuspendUser(userId: string): Promise<void> {
  await api.post(`/admin/users/${userId}/unsuspend`)
}

export async function getVerificationQueue(): Promise<VerificationItem[]> {
  const { data } = await api.get<VerificationItem[]>('/admin/verification')
  return data
}

export async function approveUniversity(universityId: string, comment?: string): Promise<void> {
  await api.post(`/admin/verification/${universityId}/approve`, { comment })
}

export async function rejectUniversity(universityId: string, comment?: string): Promise<void> {
  await api.post(`/admin/verification/${universityId}/reject`, { comment })
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
  const { data } = await api.get<ScholarshipSummaryItem[]>('/admin/scholarships/summary')
  return data
}
