import { useLocation } from 'react-router-dom'
import { AIChatDrawer } from './AIChatDrawer'
import { useAIChatStore } from '@/store/aiChatStore'

export function FloatingAIButton() {
  const location = useLocation()
  const isOpen = useAIChatStore((s) => s.isDrawerOpen)
  const setDrawerOpen = useAIChatStore((s) => s.setDrawerOpen)
  const isAIPage = location.pathname === '/ai' || location.pathname.endsWith('/ai')
  const isSearchPage = location.pathname === '/search'

  if (isAIPage || isSearchPage) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        data-onboarding="floating-ai"
        className="fixed z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-accent text-primary-dark shadow-lg hover:bg-primary-accent/90 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 right-4 md:right-6 bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
        aria-label="Open Edmission AI"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
      <AIChatDrawer open={isOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
