import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/universities', label: 'Universities' },
  { to: '/student/applications', label: 'Applications' },
  { to: '/student/offers', label: 'Offers' },
  { to: '/student/compare', label: 'Compare' },
  { to: '/student/chat', label: 'Chat' },
]

const bottomNavItems = [
  { to: '/student/dashboard', label: 'Home' },
  { to: '/student/universities', label: 'Explore' },
  { to: '/student/applications', label: 'Applications' },
  { to: '/student/chat', label: 'Chat' },
]

export function StudentLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  return (
    <div className="flex">
      <Sidebar items={navItems} />
      <div className={cn(
        'flex-1 min-w-0 transition-[margin-left] duration-200 pb-20 md:pb-0',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
      )}>
        <div className="max-w-content mx-auto w-full">
          <Outlet />
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
