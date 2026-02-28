import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/university/dashboard', label: 'Dashboard' },
  { to: '/university/profile', label: 'Профиль' },
  { to: '/university/students', label: 'Discovery' },
  { to: '/university/pipeline', label: 'Pipeline' },
  { to: '/university/scholarships', label: 'Scholarships' },
  { to: '/university/analytics', label: 'Analytics' },
  { to: '/university/chat', label: 'Chat' },
]

const bottomNavItems = [
  { to: '/university/dashboard', label: 'Home' },
  { to: '/university/students', label: 'Discovery' },
  { to: '/university/pipeline', label: 'Pipeline' },
  { to: '/university/profile', label: 'Профиль' },
  { to: '/university/chat', label: 'Chat' },
]

export function UniversityLayout() {
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
