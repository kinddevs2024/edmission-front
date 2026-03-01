import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/admin/users', label: 'Users', icon: 'Users' },
  { to: '/admin/verification', label: 'Verification', icon: 'ShieldCheck' },
  { to: '/admin/scholarships', label: 'Scholarships', icon: 'Wallet' },
  { to: '/admin/support', label: 'Support', icon: 'HelpCircle' },
  { to: '/admin/logs', label: 'Logs', icon: 'Logs' },
  { to: '/admin/health', label: 'System Health', icon: 'Activity' },
]

const bottomNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/admin/users', label: 'Users', icon: 'Users' },
  { to: '/admin/verification', label: 'Verify', icon: 'ShieldCheck' },
  { to: '/admin/logs', label: 'Logs', icon: 'Logs' },
]

export function AdminLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)
  useEffect(() => {
    setNavItems(navItems)
    return () => setNavItems(null)
  }, [setNavItems])

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
