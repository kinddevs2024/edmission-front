import { api } from './api'
import type {
  DocumentTemplate,
  RenderedTemplatePreview,
  SendDocumentPayload,
  UniversityDocumentSummary,
} from '@/types/documentModule'

export async function getDocumentTemplates(params?: { type?: 'offer' | 'scholarship'; status?: 'draft' | 'active' | 'archived' }) {
  const { data } = await api.get<DocumentTemplate[]>('/documents/templates', { params })
  return data ?? []
}

export async function getDocumentTemplate(id: string) {
  const { data } = await api.get<DocumentTemplate>(`/documents/templates/${id}`)
  return data
}

export async function createDocumentTemplate(payload: Partial<DocumentTemplate> & { type: 'offer' | 'scholarship'; name: string }) {
  const { data } = await api.post<DocumentTemplate>('/documents/templates', payload)
  return data
}

export async function updateDocumentTemplate(id: string, payload: Partial<DocumentTemplate>) {
  const { data } = await api.patch<DocumentTemplate>(`/documents/templates/${id}`, payload)
  return data
}

export async function deleteDocumentTemplate(id: string) {
  await api.delete(`/documents/templates/${id}`)
}

export async function duplicateDocumentTemplate(id: string) {
  const { data } = await api.post<DocumentTemplate>(`/documents/templates/${id}/duplicate`)
  return data
}

export async function renderDocumentTemplatePreview(id: string, payload?: { studentId?: string; acceptDeadline?: string; universityMessage?: string; documentData?: Record<string, unknown> }) {
  const { data } = await api.post<RenderedTemplatePreview>(`/documents/templates/${id}/render-preview`, payload ?? {})
  return data
}

export async function listIssuedDocuments(params?: { type?: 'offer' | 'scholarship'; status?: UniversityDocumentSummary['status'] }) {
  const { data } = await api.get<UniversityDocumentSummary[]>('/documents/student-documents', { params })
  return data ?? []
}

export async function sendIssuedDocument(payload: SendDocumentPayload) {
  const { data } = await api.post<UniversityDocumentSummary>('/documents/student-documents/send', payload)
  return data
}

export async function getIssuedDocument(id: string) {
  const { data } = await api.get<UniversityDocumentSummary>(`/documents/student-documents/${id}`)
  return data
}

export async function viewIssuedDocument(id: string) {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/view`)
  return data
}

export async function acceptIssuedDocument(id: string) {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/accept`)
  return data
}

export async function declineIssuedDocument(id: string) {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/decline`)
  return data
}

export async function postponeIssuedDocument(id: string, days: 3 | 7 | 14) {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/postpone`, { days })
  return data
}

export async function revokeIssuedDocument(id: string) {
  const { data } = await api.post<UniversityDocumentSummary>(`/documents/student-documents/${id}/revoke`)
  return data
}

export async function deleteIssuedDocument(id: string) {
  await api.delete(`/documents/student-documents/${id}`)
}
