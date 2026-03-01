import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

export function UniversityLayout() {
  const { t } = useTranslation('university')
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  useEffect(() => {
    if (location.pathname === '/university/chat' && collapsed) setSidebarCollapsed(false)
  }, [location.pathname, collapsed, setSidebarCollapsed])
  const navItems = useMemo(
    () => [
      { to: '/university/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' },
      { to: '/university/profile', label: t('navProfile'), icon: 'User' },
      { to: '/university/students', label: t('navDiscovery'), icon: 'Users' },
      { to: '/university/pipeline', label: t('navPipeline'), icon: 'GitBranch' },
      { to: '/university/scholarships', label: t('navScholarships'), icon: 'Wallet' },
      { to: '/university/analytics', label: t('navAnalytics'), icon: 'BarChart3' },
      { to: '/university/chat', label: t('navChat'), icon: 'MessageCircle' },
      { to: '/notifications', label: t('navNotifications', 'Notifications'), icon: 'Bell' },
      { to: '/payment', label: 'Subscription', icon: 'CreditCard' },
      { to: '/support', label: 'Support', icon: 'HelpCircle' },
    { to: '/university/ai', label: 'Edmission AI', icon: 'Bot' },
    ],
    [t]
  )
  const bottomNavItems = useMemo(
    () => [
      { to: '/university/dashboard', label: t('navHome'), icon: 'LayoutDashboard' },
      { to: '/university/students', label: t('navDiscovery'), icon: 'Users' },
      { to: '/university/pipeline', label: t('navPipeline'), icon: 'GitBranch' },
      { to: '/university/profile', label: t('navProfile'), icon: 'User' },
      { to: '/university/chat', label: t('navChat'), icon: 'MessageCircle' },
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
      <div className={cn('flex-1 min-w-0 pb-20 md:pb-0 transition-[margin-left] duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar')}>
        <div className="max-w-content mx-auto w-full px-2 sm:px-4 animate-page-enter">
          <Outlet />
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
