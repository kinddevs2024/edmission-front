import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AIChatDrawer } from './AIChatDrawer'
import { useAIChatStore } from '@/store/aiChatStore'

export function FloatingAIButton() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const isOpen = useAIChatStore((s) => s.isDrawerOpen)
  const setDrawerOpen = useAIChatStore((s) => s.setDrawerOpen)
  const isAIPage = location.pathname === '/ai' || location.pathname.endsWith('/ai')

  if (isAIPage) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        data-onboarding="floating-ai"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-30 w-14 h-14 rounded-full bg-primary-accent text-primary-dark shadow-lg hover:bg-primary-accent/90 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 flex items-center justify-center"
        aria-label={t('openAIChat', 'Open Edmission AI')}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
      <AIChatDrawer open={isOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
