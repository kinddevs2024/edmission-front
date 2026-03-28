import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { useTheme } from '@/hooks/useTheme'

export function AuthLayout() {
  useTheme()
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-primary-dark p-3 sm:p-4 safe-area-pb">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="flex min-h-[min(70dvh,32rem)] w-full items-center justify-center py-12" aria-hidden>
              <div className="h-8 w-8 shrink-0 rounded-full border-2 border-primary-accent border-t-transparent animate-spin" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
