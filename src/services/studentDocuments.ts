import { api } from './api'
import type { DocumentPageFormat, StudentProfileDocumentType } from '@/types/documentModule'

export type DocumentType = StudentProfileDocumentType
export type StudentProfileDocumentSource = 'upload' | 'editor'

export interface StudentDocumentItem {
  id: string
  type: DocumentType
  source: StudentProfileDocumentSource
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
  reviewedAt?: string
  rejectionReason?: string
  createdAt?: string
  updatedAt?: string
}

export interface SaveStudentDocumentPayload {
  type: DocumentType
  source?: StudentProfileDocumentSource
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

export async function getMyDocuments(): Promise<StudentDocumentItem[]> {
  const { data } = await api.get<StudentDocumentItem[]>('/student/documents')
  return data ?? []
}

export async function addDocument(payload: SaveStudentDocumentPayload): Promise<StudentDocumentItem> {
  const { data } = await api.post<StudentDocumentItem>('/student/documents', payload)
  if (!data) throw new Error('Failed to add document')
  return data
}

export async function updateDocument(id: string, payload: Partial<SaveStudentDocumentPayload>): Promise<StudentDocumentItem> {
  const { data } = await api.patch<StudentDocumentItem>(`/student/documents/${id}`, payload)
  if (!data) throw new Error('Failed to update document')
  return data
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/student/documents/${id}`)
}
