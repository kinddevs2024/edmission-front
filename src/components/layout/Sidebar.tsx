import { NavLink, useLocation } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { getNavIcon } from '@/components/icons/NavIcons'

export interface NavItem {
  to: string
  label: string
  icon?: string
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const isChatPage = location.pathname.includes('/chat')

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-primary-dark text-white transition-[width] duration-200 flex flex-col',
        isChatPage ? 'flex' : 'hidden lg:flex',
        collapsed ? 'w-[72px]' : 'w-sidebar'
      )}
    >
      <div
        className={cn(
          'p-4 border-b border-dark-border h-16 flex items-center min-h-[64px] gap-2',
          collapsed ? 'justify-center' : 'justify-start'
        )}
      >
        <img src="/favicon.svg" alt="" className="h-8 w-8 shrink-0 rounded-lg" aria-hidden />
        {!collapsed && <span className="font-semibold text-primary-accent">Edmission</span>}
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-input text-sm transition-all duration-200',
                isActive
                  ? 'bg-primary-accent/20 text-primary-accent shadow-sm'
                  : 'text-dark-muted hover:bg-secondary hover:text-white'
              )
            }
          >
            <span className="shrink-0 w-5 h-5 flex items-center justify-center">
              {getNavIcon(icon, 'size-5')}
            </span>
            {!collapsed && <span className="flex-1 truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
