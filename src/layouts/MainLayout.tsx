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
      <main className="p-4">
        <Outlet />
      </main>
      {isAuthenticated && <FloatingAIButton />}
      <VersionBadge />
    </div>
  )
}
