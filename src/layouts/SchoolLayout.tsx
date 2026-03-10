import { Outlet } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

export function SchoolLayout() {
  const { t } = useTranslation('school')
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  const navItems = useMemo(
    () => [
      { to: '/school/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
      { to: '/school/my-school', label: t('mySchool'), icon: 'Building2' as const },
      { to: '/school/my-students', label: t('myStudents'), icon: 'Users' as const },
      { to: '/school/join-requests', label: t('joinRequests'), icon: 'Users' as const },
      { to: '/notifications', label: t('notifications'), icon: 'Bell' as const },
    ],
    [t]
  )

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
    setNavItems(navItems)
    return () => setNavItems(null)
  }, [setNavItems, navItems])

  return (
    <div className="flex">
      <Sidebar items={navItems} />
      <div className={cn('flex-1 min-w-0 pb-20 md:pb-0 transition-[margin-left] duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar')}>
        <div className="max-w-content mx-auto w-full px-2 sm:px-4 animate-page-enter">
          <Outlet />
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
