import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { useTheme } from '@/hooks/useTheme'

export function AuthLayout() {
  useTheme()
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-primary-dark p-3 sm:p-4 safe-area-pb">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" /></div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
