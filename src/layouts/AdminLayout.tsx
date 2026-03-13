import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'
import { ContentFallback } from '@/components/layout/ContentFallback'

export function AdminLayout() {
  const { t } = useTranslation('admin')
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  const navItems = useMemo(
    () => [
      { to: '/admin/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
      { to: '/admin/users', label: t('users'), icon: 'Users' as const },
      { to: '/admin/verification', label: t('verification'), icon: 'ShieldCheck' as const },
      { to: '/admin/universities', label: t('universityCatalog', 'Universities'), icon: 'Building2' as const },
      { to: '/admin/university-requests', label: t('universityRequests', 'Uni requests'), icon: 'Users' as const },
      { to: '/admin/investors', label: t('investors', 'Investors'), icon: 'Building2' as const },
      { to: '/admin/landing-certificates', label: t('landingCertificates', 'Landing Certificates'), icon: 'Award' as const },
      { to: '/admin/offers', label: t('offers'), icon: 'Gift' as const },
      { to: '/admin/interests', label: t('interests'), icon: 'Heart' as const },
      { to: '/admin/chats', label: t('chats'), icon: 'MessageCircle' as const },
      { to: '/admin/scholarships', label: t('scholarships'), icon: 'Wallet' as const },
      { to: '/admin/logs', label: t('logs'), icon: 'Logs' as const },
      { to: '/admin/health', label: t('systemHealth'), icon: 'Activity' as const },
      { to: '/admin/ai', label: 'Edmission AI', icon: 'Bot' as const },
    ],
    [t]
  )
  const navBottomItems = useMemo(
    () => [
      { to: '/admin/support', label: t('support'), icon: 'HelpCircle' as const },
      { to: '/admin/settings', label: t('settings.title', 'Settings'), icon: 'Settings' as const },
    ],
    [t]
  )

  // Mobile bottom bar: no AI, no Support
  const bottomNavItems = useMemo(
    () => [
      { to: '/admin/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
      { to: '/admin/users', label: t('users'), icon: 'Users' as const },
      { to: '/admin/offers', label: t('offers'), icon: 'Gift' as const },
      { to: '/admin/verification', label: t('verification'), icon: 'ShieldCheck' as const },
      { to: '/admin/support', label: t('support'), icon: 'HelpCircle' as const },
    ],
    [t]
  )

  useEffect(() => {
    setNavItems([...navItems, ...navBottomItems])
    return () => setNavItems(null)
  }, [setNavItems, navItems, navBottomItems])

  return (
    <div className="flex">
      <Sidebar items={navItems} bottomItems={navBottomItems} />
      <div className={cn('flex-1 min-w-0 pb-20 md:pb-0 transition-[margin-left] duration-200 flex flex-col', collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar')}>
        <div className="hidden md:flex items-center px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-card)] shrink-0">
          <div className="max-w-content w-full mx-auto">
            <GlobalSearch />
          </div>
        </div>
        <div className="max-w-content mx-auto w-full px-2 sm:px-4 animate-page-enter flex-1">
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
