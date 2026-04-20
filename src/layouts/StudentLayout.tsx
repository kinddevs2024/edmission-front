import { Outlet, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { RoleOnboardingController } from '@/components/onboarding/RoleOnboardingController'
import { cn } from '@/utils/cn'
import { ContentFallback } from '@/components/layout/ContentFallback'
import { buildStudentNavigation } from '@/navigation/studentNav'

export function StudentLayout() {
  const { t } = useTranslation('student')
  const { user } = useAuth()
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)
  const educationStatus = user?.studentProfile?.educationStatus
  const counsellorLinked = Boolean((user?.studentProfile as { counsellorUserId?: string } | undefined)?.counsellorUserId)
  const showMySchools =
    (educationStatus === 'in_school' || educationStatus === 'finished_school') && !counsellorLinked

  const isChatPage = location.pathname === '/student/chat'
  const isFixedHeightPage = location.pathname === '/student/ai' || isChatPage

  const { bottomNavItems, sidebarItems, sidebarBottomItems, mobileMenuItems } = useMemo(
    () =>
      buildStudentNavigation(
        (key, defaultValue) => t(key, { defaultValue: defaultValue ?? key }),
        { showMySchools }
      ),
    [t, showMySchools]
  )

  useEffect(() => {
    setNavItems(mobileMenuItems)
    return () => setNavItems(null)
  }, [mobileMenuItems, setNavItems])

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1">
      <RoleOnboardingController role="student" />
      <Sidebar items={sidebarItems} bottomItems={sidebarBottomItems} />
      <div className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col transition-[margin-left] duration-200',
        isFixedHeightPage
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden pb-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:pt-16'
          : 'h-full pb-mobile-nav lg:pt-16',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
      )}>
        <div
          className={cn(
            'mx-auto flex w-full flex-col animate-page-enter',
            isChatPage
              ? 'h-full min-h-0 flex-1 max-w-none overflow-hidden px-0 sm:px-0'
              : 'max-w-content px-2 sm:px-4',
            isFixedHeightPage ? 'h-full min-h-0 flex-1 overflow-hidden' : 'min-h-0 flex-1'
          )}
        >
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
