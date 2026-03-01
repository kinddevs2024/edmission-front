import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

export function StudentLayout() {
  const { t } = useTranslation('student')
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  useEffect(() => {
    if (location.pathname === '/student/chat' && collapsed) setSidebarCollapsed(false)
  }, [location.pathname, collapsed, setSidebarCollapsed])

  const navItems = useMemo(
    () => [
      { to: '/student/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' },
      { to: '/student/profile', label: t('navProfile'), icon: 'User' },
      { to: '/student/universities', label: t('navUniversities'), icon: 'GraduationCap' },
      { to: '/student/applications', label: t('navApplications'), icon: 'FileCheck' },
      { to: '/student/documents', label: t('navDocuments', 'Documents'), icon: 'FileText' },
      { to: '/student/offers', label: t('navOffers'), icon: 'Gift' },
      { to: '/student/compare', label: t('navCompare'), icon: 'GitCompare' },
      { to: '/student/chat', label: t('navChat'), icon: 'MessageCircle' },
      { to: '/notifications', label: t('navNotifications', 'Notifications'), icon: 'Bell' },
      { to: '/payment', label: 'Subscription', icon: 'CreditCard' },
      { to: '/support', label: 'Support', icon: 'HelpCircle' },
    { to: '/student/ai', label: 'Edmission AI', icon: 'Bot' },
    ],
    [t]
  )
  const bottomNavItems = useMemo(
    () => [
      { to: '/student/dashboard', label: t('navHome'), icon: 'LayoutDashboard' },
      { to: '/student/universities', label: t('navExplore'), icon: 'GraduationCap' },
      { to: '/student/applications', label: t('navApplications'), icon: 'FileCheck' },
      { to: '/student/profile', label: t('navProfile'), icon: 'User' },
      { to: '/student/chat', label: t('navChat'), icon: 'MessageCircle' },
    ],
    [t]
  )
  useEffect(() => {
    setNavItems(navItems)
    return () => setNavItems(null)
  }, [navItems, setNavItems])

  return (
    <div className="flex">
      <Sidebar items={navItems} />
      <div className={cn(
        'flex-1 min-w-0 transition-[margin-left] duration-200 pb-20 md:pb-0',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
      )}>
        <div className="max-w-content mx-auto w-full px-2 sm:px-4 animate-page-enter">
          <Outlet />
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
