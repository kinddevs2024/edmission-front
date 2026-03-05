import { Outlet } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

export function AdminLayout() {
  const { t } = useTranslation('admin')
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  const navItems = useMemo(
    () => [
      { to: '/admin/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' },
      { to: '/admin/users', label: t('users'), icon: 'Users' },
      { to: '/admin/verification', label: t('verification'), icon: 'ShieldCheck' },
      { to: '/admin/offers', label: t('offers'), icon: 'Gift' },
      { to: '/admin/interests', label: t('interests'), icon: 'Heart' },
      { to: '/admin/chats', label: t('chats'), icon: 'MessageCircle' },
      { to: '/admin/scholarships', label: t('scholarships'), icon: 'Wallet' },
      { to: '/admin/support', label: t('support'), icon: 'HelpCircle' },
      { to: '/admin/logs', label: t('logs'), icon: 'Logs' },
      { to: '/admin/health', label: t('systemHealth'), icon: 'Activity' },
    ],
    [t]
  )

  const bottomNavItems = useMemo(
    () => [
      { to: '/admin/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' },
      { to: '/admin/users', label: t('users'), icon: 'Users' },
      { to: '/admin/offers', label: t('offers'), icon: 'Gift' },
      { to: '/admin/verification', label: t('verification'), icon: 'ShieldCheck' },
      { to: '/admin/logs', label: t('logs'), icon: 'Logs' },
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
