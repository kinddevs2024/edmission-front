import type { ApplicationStatus } from '@/types/student'

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: 'Interested',
  under_review: 'Under Review',
  chat_opened: 'Chat Opened',
  offer_sent: 'Offer Sent',
  rejected: 'Rejected',
  accepted: 'Accepted',
}

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  interested: 'bg-[#3B82F6]/20 text-[#3B82F6]',
  under_review: 'bg-[#3B82F6]/20 text-[#3B82F6]',
  chat_opened: 'bg-[#84CC16]/20 text-[#84CC16]',
  offer_sent: 'bg-[#84CC16]/20 text-[#84CC16]',
  rejected: 'bg-[#64748B]/20 text-[#64748B]',
  accepted: 'bg-[#22C55E]/20 text-[#22C55E]',
}

export const SCHOLARSHIP_TYPES = ['full', 'partial', 'budget'] as const
export const LANGUAGES = ['en', 'ru', 'uz'] as const
export const THEMES = ['light', 'dark'] as const
