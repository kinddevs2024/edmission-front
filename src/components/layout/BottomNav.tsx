import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { getNavIcon } from '@/components/icons/NavIcons'
import type { NavItem } from '@/components/layout/Sidebar'

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28 md:hidden"
        aria-hidden
      >
        <div
          className="absolute inset-x-0 bottom-0 h-full bg-[linear-gradient(to_top,rgba(248,250,252,0.82)_0%,rgba(248,250,252,0.54)_32%,rgba(248,250,252,0.18)_62%,rgba(248,250,252,0)_100%)] backdrop-blur-[14px] dark:bg-[linear-gradient(to_top,rgba(15,23,42,0.88)_0%,rgba(15,23,42,0.58)_34%,rgba(15,23,42,0.2)_64%,rgba(15,23,42,0)_100%)]"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.72) 35%, rgba(0,0,0,0.2) 72%, transparent 100%)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.72) 35%, rgba(0,0,0,0.2) 72%, transparent 100%)',
          }}
        />
      </div>

      <nav
        className="fixed bottom-3 left-3 right-3 z-40 flex items-center justify-around rounded-2xl bg-[var(--color-card)]/92 border border-[var(--color-border)] shadow-lg py-2 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
        aria-label="Main navigation"
      >
        {items.map(({ to, label, icon }) => {
          const onboardingId = to.startsWith('/student/')
            ? `nav-${to.replace(/^\/student\//, '').replace(/\//g, '-')}`
            : to.startsWith('/university/')
              ? `nav-${to.replace(/^\/university\//, '').replace(/\//g, '-')}`
              : undefined
          return (
          <NavLink
            key={to}
            to={to}
            {...(onboardingId ? { 'data-onboarding': onboardingId } : {})}
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
          )
        })}
      </nav>
    </>
  )
}
