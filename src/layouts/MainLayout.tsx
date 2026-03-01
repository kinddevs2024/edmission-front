import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { TopBar } from '@/components/layout/TopBar'
import { FloatingAIButton } from '@/components/ai/FloatingAIButton'
import { VersionBadge } from '@/components/VersionBadge'

export function MainLayout() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {isAuthenticated && <TopBar />}
      <main className="p-3 sm:p-4 min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
      {isAuthenticated && <FloatingAIButton />}
      <VersionBadge />
    </div>
  )
}
