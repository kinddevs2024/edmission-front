import { api } from './api'

export interface AdmissionLead {
  _id: string; name?: string; username?: string; phone?: string; language?: string; status: string
  profile?: Record<string, unknown>; studyFacts?: Record<string, unknown>; summary?: string; notes?: string
}
export interface AdmissionMessage {
  _id: string; text: string; direction: 'in' | 'out' | 'staff'; createdAt: string
  provider?: string; delivered?: boolean; isCallback?: boolean; originalText?: string; edits?: { text: string; at: string }[]
}
export interface AdmissionBooking {
  _id: string; leadId: AdmissionLead | null; start: string; end: string; status: string
  attendance?: string; consultantName?: string; mode?: string; location?: string
  slot?: { consultantName?: string; mode?: string; location?: string }; slotId?: { consultantName?: string; mode?: string; location?: string } | string
}
export interface AdmissionQuestion extends AdmissionMessage {
  leadId: AdmissionLead | null; answers?: AdmissionMessage[]
}
export interface AdmissionPage<T> { items: T[]; total: number; page?: number; limit?: number }
export const admissions = {
  bookings: (params: { page: number; q: string; status: string }, signal?: AbortSignal) => api.get<AdmissionPage<AdmissionBooking>>('/admissions/bookings', { params, signal }).then(r => r.data),
  leads: (params: { page: number; q: string }, signal?: AbortSignal) => api.get<AdmissionPage<AdmissionLead>>('/admissions/leads', { params, signal }).then(r => r.data),
  questions: (params: { page: number; q: string }, signal?: AbortSignal) => api.get<AdmissionPage<AdmissionQuestion>>('/admissions/questions', { params, signal }).then(r => r.data),
  lead: (id: string, signal?: AbortSignal) => api.get<{ lead: AdmissionLead; bookings: AdmissionBooking[] }>('/admissions/leads/' + id, { signal }).then(r => r.data),
  messages: (id: string, before?: string, signal?: AbortSignal) => api.get<{ items: AdmissionMessage[]; nextCursor: string | null }>('/admissions/leads/' + id + '/messages', { params: { before, limit: 50 }, signal }).then(r => r.data),
}
