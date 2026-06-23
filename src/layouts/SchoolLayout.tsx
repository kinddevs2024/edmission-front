import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'
import { ContentFallback } from '@/components/layout/ContentFallback'

export function SchoolLayout() {
  const { t } = useTranslation(['school', 'common'])
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  const navItems = useMemo(
    () => [
      { to: '/school/dashboard', label: t('school:dashboard'), icon: 'LayoutDashboard' as const },
      { to: '/ai', label: t('common:supportChat', 'Support chat'), icon: 'MessageCircle' as const },
      { to: '/school/my-school', label: t('school:mySchool'), icon: 'Building2' as const },
      { to: '/school/my-students', label: t('school:myStudents'), icon: 'Users' as const },
      { to: '/school/my-students/map', label: t('school:studentMap', 'Student map'), icon: 'Map' as const },
      { to: '/school/student-interests', label: t('school:studentInterestsNav', 'Student interests'), icon: 'HeartHandshake' as const },
      { to: '/school/applications', label: t('school:applications', 'Applications'), icon: 'Heart' as const },
      { to: '/school/offers', label: t('school:offers', 'Offers'), icon: 'Gift' as const },
      { to: '/school/chats', label: t('school:chats', 'Chats'), icon: 'MessageCircle' as const },
      { to: '/school/join-requests', label: t('school:joinRequests'), icon: 'Users' as const },
      { to: '/notifications', label: t('school:notifications'), icon: 'Bell' as const },
    ],
    [t]
  )
  const navBottomItems = useMemo(
    () => [
      { to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' as const },
      { to: '/profile', label: t('school:profile', 'Profile'), icon: 'Settings' as const },
    ],
    [t]
  )

  // Mobile bottom bar: no AI, no Support (old version only)
  const bottomNavItems = useMemo(
    () => [
      { to: '/school/dashboard', label: t('school:dashboard'), icon: 'LayoutDashboard' as const },
      { to: '/school/my-school', label: t('school:mySchool'), icon: 'Building2' as const },
      { to: '/school/my-students', label: t('school:myStudents'), icon: 'Users' as const },
      { to: '/school/student-interests', label: t('school:studentInterestsNav', 'Student interests'), icon: 'HeartHandshake' as const },
      { to: '/school/applications', label: t('school:applications', 'Applications'), icon: 'Heart' as const },
      { to: '/school/offers', label: t('school:offers', 'Offers'), icon: 'Gift' as const },
      { to: '/school/chats', label: t('school:chats', 'Chats'), icon: 'MessageCircle' as const },
    ],
    [t]
  )

  useEffect(() => {
    setNavItems([...navItems, ...navBottomItems])
    return () => setNavItems(null)
  }, [setNavItems, navItems, navBottomItems])

  return (
    <div className="flex flex-1 w-full min-h-full">
      <Sidebar items={navItems} bottomItems={navBottomItems} />
      <div className={cn(
        'flex-1 min-w-0 min-h-full pb-mobile-nav pt-3 sm:pt-4 transition-[margin-left] duration-200 flex flex-col lg:pt-16',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
      )}>
        <div className="max-w-content mx-auto w-full px-2 sm:px-4 min-h-full flex flex-col">
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
