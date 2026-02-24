import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/verification', label: 'Verification' },
  { to: '/admin/scholarships', label: 'Scholarships' },
  { to: '/admin/logs', label: 'Logs' },
  { to: '/admin/health', label: 'System Health' },
]

const bottomNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/verification', label: 'Verify' },
  { to: '/admin/logs', label: 'Logs' },
]

export function AdminLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  return (
    <div className="flex">
      <Sidebar items={navItems} />
      <div className={cn('flex-1 min-w-0 pb-20 md:pb-0 transition-[margin-left] duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar')}>
        <div className="max-w-content mx-auto w-full">
          <Outlet />
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
