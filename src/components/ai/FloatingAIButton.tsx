import { useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { isUniversityLikeRole } from '@/types/user'

export function FloatingAIButton() {
  const location = useLocation()
  const navigate = useNavigate()
  const { role } = useAuth()
  const { t } = useTranslation('common')
  const isSupportChatPage = location.pathname === '/ai' || location.pathname.endsWith('/ai')
  const isSearchPage = location.pathname === '/search'

  if (isSupportChatPage || isSearchPage) return null

  const supportPath =
    role === 'admin' || role === 'manager' || role === 'counsellor_coordinator'
      ? '/admin/ai'
      : role === 'student'
        ? '/student/ai'
        : isUniversityLikeRole(role)
          ? '/university/ai'
          : '/ai'

  return (
    <button
      type="button"
      onClick={() => navigate(supportPath)}
      data-onboarding="floating-ai"
      className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-accent text-primary-dark shadow-lg transition-all duration-200 ease-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 md:bottom-6 md:right-6"
      aria-label={t('openSupportChat', 'Open support chat')}
      title={t('openSupportChat', 'Open support chat')}
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </button>
  )
}
