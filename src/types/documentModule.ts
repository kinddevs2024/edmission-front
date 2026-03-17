export type DocumentType = 'offer' | 'scholarship'
export type StudentProfileDocumentType = 'transcript' | 'diploma' | 'language_certificate' | 'course_certificate' | 'passport' | 'id_card' | 'other'
export type EditorDocumentType = DocumentType | StudentProfileDocumentType
export type DocumentTemplateStatus = 'draft' | 'active' | 'archived'
export type DocumentPageFormat = 'A4_PORTRAIT' | 'A4_LANDSCAPE' | 'LETTER' | 'CUSTOM'
export type StudentDocumentStatus = 'sent' | 'viewed' | 'accepted' | 'declined' | 'postponed' | 'expired' | 'revoked'
export type DocumentSceneElementType = 'text' | 'image' | 'logo' | 'signature' | 'shape' | 'line'

export interface DocumentSceneElement {
  id: string
  type: DocumentSceneElementType
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  locked?: boolean
  layer?: number
  opacity?: number
  content?: string
  src?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  radius?: number
  points?: number[]
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
}

export interface DocumentScene {
  version: string
  page: {
    format: DocumentPageFormat
    width: number
    height: number
    backgroundColor?: string
    safeMargin?: number
  }
  elements: DocumentSceneElement[]
}

export interface DocumentTemplateAsset {
  id?: string
  templateId?: string
  type: 'image' | 'logo' | 'signature' | 'background' | 'pdf_background'
  fileUrl: string
  fileName: string
  mimeType: string
  width?: number
  height?: number
}

export interface DocumentTemplate {
  id: string
  type: DocumentType
  name: string
  status: DocumentTemplateStatus
  pageFormat: DocumentPageFormat
  width?: number
  height?: number
  editorVersion: string
  canvasJson: string
  previewImageUrl?: string
  isDefault?: boolean
  summary?: string
  updatedAt?: string
  createdAt?: string
  assets?: DocumentTemplateAsset[]
}

export interface EditableSceneDocument {
  id?: string
  name: string
  type: EditorDocumentType
  pageFormat: DocumentPageFormat
  width?: number
  height?: number
  editorVersion: string
  canvasJson: string
  previewImageUrl?: string
  assets?: DocumentTemplateAsset[]
  status?: DocumentTemplateStatus
}

export interface RenderedTemplatePreview {
  templateId: string
  type: DocumentType
  renderedPayload: Record<string, unknown>
  resolvedCanvasJson: string
  summary?: string
}

export interface UniversityDocumentSummary {
  id: string
  type: DocumentType
  status: StudentDocumentStatus
  title?: string
  universityMessage?: string
  renderedPayload: Record<string, unknown>
  frozenTemplateJson: string
  resolvedCanvasJson?: string
  pageFormat?: DocumentPageFormat
  width?: number
  height?: number
  sentAt: string
  viewedAt?: string
  decisionAt?: string
  postponeUntil?: string
  expiresAt?: string
  createdAt?: string
  updatedAt?: string
  university?: {
    name: string
    logoUrl?: string
    city?: string
    country?: string
  }
  student?: {
    fullName: string
    country?: string
  }
  events?: DocumentEvent[]
}

export interface DocumentEvent {
  id: string
  actorType: 'university' | 'student' | 'system'
  actorId?: string
  eventType:
    | 'created'
    | 'sent'
    | 'viewed'
    | 'accepted'
    | 'declined'
    | 'postponed'
    | 'expired'
    | 'revoked'
    | 'chat_message_created'
    | 'notification_sent'
  meta?: Record<string, unknown>
  createdAt: string
}

export interface SendDocumentPayload {
  studentId: string
  chatId?: string
  templateId: string
  type: DocumentType
  acceptDeadline?: string
  universityMessage?: string
  title?: string
  documentData?: Record<string, unknown>
}
