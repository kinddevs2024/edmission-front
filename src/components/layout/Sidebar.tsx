import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { getNavIcon } from '@/components/icons/NavIcons'
import { BrandLogo, BrandMark } from '@/components/layout/BrandLogo'
import { getDashboardPath } from '@/utils/dashboardPath'

export interface NavItem {
  to: string
  label: string
  icon?: string
  /** Renders a section label above this item (use on the first item of a group). */
  section?: string
}

function NavLinkItem({
  to,
  label,
  icon,
  collapsed,
  section: _section,
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
          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200',
          collapsed && 'justify-center px-2',
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
        'fixed left-0 top-0 z-40 hidden h-dvh max-h-dvh min-h-0 flex-col bg-primary-dark text-white transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[72px]' : 'w-sidebar'
      )}
    >
      <div className="flex h-16 min-h-16 shrink-0 items-center border-b border-white/10">
        <Link
          to={dashboardPath}
          className={cn(
            'box-border flex h-full flex-1 items-center gap-2 px-4 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-accent/70',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          aria-label="Edmission"
        >
          {collapsed ? (
            <BrandMark className="h-9 w-9 shrink-0 rounded-lg overflow-hidden" />
          ) : (
            <BrandLogo mode="dark" imageClassName="h-8 w-auto" />
          )}
        </Link>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col p-3">
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {items.map((item) => (
            <div key={item.to}>
              {item.section && !collapsed ? (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  {item.section}
                </p>
              ) : null}
              <NavLinkItem {...item} collapsed={collapsed} />
            </div>
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
