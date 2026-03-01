import { api } from './api'

export type DocumentType = 'transcript' | 'diploma' | 'language_certificate' | 'course_certificate' | 'other'

export interface StudentDocumentItem {
  id: string
  type: string
  name?: string
  certificateType?: string
  score?: string
  fileUrl: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  rejectionReason?: string
  createdAt?: string
}

export interface AddDocumentPayload {
  type: DocumentType
  fileUrl: string
  name?: string
  certificateType?: string
  score?: string
}

export async function getMyDocuments(): Promise<StudentDocumentItem[]> {
  const { data } = await api.get<StudentDocumentItem[]>('/student/documents')
  return data ?? []
}

export async function addDocument(payload: AddDocumentPayload): Promise<StudentDocumentItem> {
  const { data } = await api.post<StudentDocumentItem>('/student/documents', payload)
  if (!data) throw new Error('Failed to add document')
  return data
}
