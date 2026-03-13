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
  const { t } = useTranslation('school')
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  const navItems = useMemo(
    () => [
      { to: '/school/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
      { to: '/ai', label: 'Edmission AI', icon: 'Bot' as const },
      { to: '/school/my-school', label: t('mySchool'), icon: 'Building2' as const },
      { to: '/school/my-students', label: t('myStudents'), icon: 'Users' as const },
      { to: '/school/join-requests', label: t('joinRequests'), icon: 'Users' as const },
      { to: '/notifications', label: t('notifications'), icon: 'Bell' as const },
    ],
    [t]
  )
  const navBottomItems = useMemo(
    () => [
      { to: '/support', label: 'Support', icon: 'HelpCircle' as const },
      { to: '/profile', label: t('account', 'Account'), icon: 'Settings' as const },
    ],
    [t]
  )

  // Mobile bottom bar: no AI, no Support (old version only)
  const bottomNavItems = useMemo(
    () => [
      { to: '/school/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
      { to: '/school/my-school', label: t('mySchool'), icon: 'Building2' as const },
      { to: '/school/my-students', label: t('myStudents'), icon: 'Users' as const },
      { to: '/school/join-requests', label: t('joinRequests'), icon: 'Users' as const },
    ],
    [t]
  )

  useEffect(() => {
    setNavItems([...navItems, ...navBottomItems])
    return () => setNavItems(null)
  }, [setNavItems, navItems, navBottomItems])

  return (
    <div className="flex">
      <Sidebar items={navItems} bottomItems={navBottomItems} />
      <div className={cn('flex-1 min-w-0 pb-20 md:pb-0 transition-[margin-left] duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar')}>
        <div className="max-w-content mx-auto w-full px-2 sm:px-4 animate-page-enter">
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
