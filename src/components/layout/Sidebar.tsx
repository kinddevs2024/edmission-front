import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { getNavIcon } from '@/components/icons/NavIcons'
import { getDashboardPath } from '@/utils/dashboardPath'

export interface NavItem {
  to: string
  label: string
  icon?: string
}

function NavLinkItem({
  to,
  label,
  icon,
  collapsed,
}: NavItem & { collapsed: boolean }) {
  const onboardingId = to.startsWith('/student/')
    ? `nav-${to.replace(/^\/student\//, '').replace(/\//g, '-')}`
    : to.startsWith('/university/')
      ? `nav-${to.replace(/^\/university\//, '').replace(/\//g, '-')}`
      : undefined
  return (
    <NavLink
      to={to}
      {...(onboardingId ? { 'data-onboarding': onboardingId } : {})}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-200',
          isActive ? 'text-primary-accent' : 'text-dark-muted hover:bg-white/5 hover:text-white'
        )
      }
      children={({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl bg-primary-accent/20 shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              aria-hidden
            />
          )}
          <span className="relative z-10 shrink-0 w-5 h-5 flex items-center justify-center">
            {getNavIcon(icon, 'size-5')}
          </span>
          {!collapsed && <span className="relative z-10 flex-1 truncate">{label}</span>}
        </>
      )}
    />
  )
}

export function Sidebar({
  items,
  bottomItems = [],
}: {
  items: NavItem[]
  bottomItems?: NavItem[]
}) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const { user } = useAuth()
  const dashboardPath = getDashboardPath(user)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-primary-dark text-white transition-[width] duration-200 hidden lg:flex flex-col',
        collapsed ? 'w-[72px]' : 'w-sidebar'
      )}
    >
      <Link
        to={dashboardPath}
        className={cn(
          'p-4 border-b border-white/10 h-16 min-h-[64px] shrink-0 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-accent/70',
          'flex items-center gap-2',
          collapsed ? 'justify-center' : 'justify-start'
        )}
      >
        <img src="/logo/Group%201.png" alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" aria-hidden />
        {!collapsed && <span className="font-semibold text-primary-accent">Edmission</span>}
      </Link>
      <nav className="flex-1 min-h-0 flex flex-col p-3">
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {items.map((item) => (
            <NavLinkItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </div>
        {bottomItems.length > 0 && (
          <div className="mt-auto pt-3 border-t border-white/10 space-y-0.5 shrink-0">
            {bottomItems.map((item) => (
              <NavLinkItem key={item.to} {...item} collapsed={collapsed} />
            ))}
          </div>
        )}
      </nav>
    </aside>
  )
}
