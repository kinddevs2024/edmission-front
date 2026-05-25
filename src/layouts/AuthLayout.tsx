import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { LanguageMenu } from '@/components/layout/LanguageMenu'

export function AuthLayout() {
  useTheme()
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col items-center justify-center bg-surface-light dark:bg-primary-dark p-3 pt-14 sm:p-4 sm:pt-16 safe-area-pb">
      <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
        <LanguageMenu placement="bottom" />
      </div>
      <div className="w-full max-w-[22rem] sm:max-w-md">
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
