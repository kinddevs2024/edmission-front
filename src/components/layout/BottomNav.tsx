import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { getNavIcon } from '@/components/icons/NavIcons'
import type { NavItem } from '@/components/layout/Sidebar'

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[var(--color-card)] border-t border-[var(--color-border)] safe-area-pb md:hidden"
      aria-label="Main navigation"
    >
      {items.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs font-medium transition-all duration-200 min-w-0 gap-1',
              isActive ? 'text-primary-accent' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            )
          }
        >
          <span className="shrink-0 flex items-center justify-center">
            {getNavIcon(icon, 'size-5')}
          </span>
          <span className="truncate w-full text-center">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
