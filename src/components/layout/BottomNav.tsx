import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface NavItem {
  to: string
  label: string
}

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[var(--color-card)] border-t border-[var(--color-border)] safe-area-pb md:hidden"
      aria-label="Main navigation"
    >
      {items.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs font-medium transition-colors min-w-0',
              isActive ? 'text-primary-accent' : 'text-[var(--color-text-muted)]'
            )
          }
        >
          <span className="truncate w-full text-center">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
