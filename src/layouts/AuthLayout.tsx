import { Outlet, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { AuthStepTransition } from '@/components/auth/AuthStepTransition'
import autumnCampus from '@/assets/auth/auth-autumn-campus.jpg'

export function AuthLayout() {
  useTheme()
  const location = useLocation()
  const showCampus = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className={`relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden p-3 pt-14 safe-area-pb sm:p-4 sm:pt-16 ${showCampus ? 'bg-stone-950' : 'bg-surface-light dark:bg-primary-dark'}`}>
      {showCampus && <>
        <div aria-hidden className="absolute inset-0 bg-cover bg-[66%_center] sm:bg-[64%_center] lg:bg-[right_center]" style={{ backgroundImage: `url(${autumnCampus})` }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/60 lg:bg-gradient-to-r lg:from-black/70 lg:via-black/25 lg:to-transparent" />
      </>}
      <div className={`absolute right-3 top-3 z-10 rounded-lg sm:right-4 sm:top-4 ${showCampus ? 'bg-black/25 p-1 backdrop-blur-sm' : ''}`}>
        <LanguageMenu placement="bottom" />
      </div>
      <div className={`relative z-[1] w-full max-w-[22rem] sm:max-w-md ${showCampus ? 'md:mr-auto md:ml-[8vw]' : ''}`}>
        <Suspense fallback={
          <div className="flex min-h-[min(70dvh,32rem)] w-full items-center justify-center py-12" aria-hidden>
            <div className="h-8 w-8 shrink-0 rounded-full border-2 border-primary-accent border-t-transparent animate-spin" />
          </div>
        }>
          <AuthStepTransition stepKey={location.key} className="w-full">
            <Outlet />
          </AuthStepTransition>
        </Suspense>
      </div>
    </div>
  )
}
