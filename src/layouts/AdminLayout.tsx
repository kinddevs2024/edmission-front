import { Outlet, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'
import { ContentFallback } from '@/components/layout/ContentFallback'

export function AdminLayout() {
  const { t } = useTranslation(['admin', 'common'])
  const { role } = useAuth()
  const isFullAdmin = role === 'admin'
  const location = useLocation()
  const isFixedHeightPage = location.pathname === '/admin/ai'
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  const navItems = useMemo(
    () => (
      isFullAdmin
        ? [
            { to: '/admin/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
            { to: '/admin/analytics', label: t('analytics', 'Analytics'), icon: 'BarChart3' as const },
            { to: '/admin/users', label: t('users'), icon: 'Users' as const },
            { to: '/admin/verification', label: t('verification'), icon: 'ShieldCheck' as const },
            { to: '/admin/documents', label: t('documentReviewNav', 'Certificates'), icon: 'FileCheck' as const },
            { to: '/admin/universities', label: t('universityCatalog', 'Universities'), icon: 'Building2' as const },
            { to: '/admin/faculties', label: t('faculties', 'Faculties'), icon: 'GraduationCap' as const },
            { to: '/admin/university-requests', label: t('universityRequests', 'Requests'), icon: 'Users' as const },
            { to: '/admin/investors', label: t('investors', 'Investors'), icon: 'Building2' as const },
            { to: '/admin/landing-certificates', label: t('landingCertificates', 'Landing Certificates'), icon: 'Award' as const },
            { to: '/admin/offers', label: t('offers'), icon: 'Gift' as const },
            { to: '/admin/interests', label: t('interests'), icon: 'Heart' as const },
            { to: '/admin/chats', label: t('chats'), icon: 'MessageCircle' as const },
            { to: '/admin/scholarships', label: t('scholarships'), icon: 'Wallet' as const },
            { to: '/admin/logs', label: t('logs'), icon: 'Logs' as const },
            { to: '/admin/health', label: t('systemHealth'), icon: 'Activity' as const },
            { to: '/admin/ai', label: t('common:edmissionAi', 'Edmission AI'), icon: 'Bot' as const },
          ]
        : [
            { to: '/admin/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
            { to: '/admin/users', label: t('users'), icon: 'Users' as const },
            { to: '/admin/interests', label: t('interests'), icon: 'Heart' as const },
            { to: '/admin/ai', label: t('common:edmissionAi', 'Edmission AI'), icon: 'Bot' as const },
          ]
    ),
    [isFullAdmin, t]
  )
  const navBottomItems = useMemo(
    () => isFullAdmin
      ? [
          { to: '/admin/support', label: t('support'), icon: 'HelpCircle' as const },
          { to: '/admin/settings', label: t('settings.title', 'Settings'), icon: 'Settings' as const },
        ]
      : [],
    [isFullAdmin, t]
  )

  // Mobile bottom bar: no AI, no Support
  const bottomNavItems = useMemo(
    () => isFullAdmin
      ? [
          { to: '/admin/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
          { to: '/admin/analytics', label: t('analytics', 'Analytics'), icon: 'BarChart3' as const },
          { to: '/admin/users', label: t('users'), icon: 'Users' as const },
          { to: '/admin/offers', label: t('offers'), icon: 'Gift' as const },
          { to: '/admin/support', label: t('support'), icon: 'HelpCircle' as const },
        ]
      : [
          { to: '/admin/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' as const },
          { to: '/admin/users', label: t('users'), icon: 'Users' as const },
          { to: '/admin/interests', label: t('interests'), icon: 'Heart' as const },
          { to: '/admin/ai', label: t('common:edmissionAi', 'AI'), icon: 'Bot' as const },
        ],
    [isFullAdmin, t]
  )

  useEffect(() => {
    setNavItems([...navItems, ...navBottomItems])
    return () => setNavItems(null)
  }, [setNavItems, navItems, navBottomItems])

  return (
    <div className="flex flex-1 w-full min-h-full">
      <Sidebar items={navItems} bottomItems={navBottomItems} />
      <div className={cn(
        'flex-1 min-w-0 pb-mobile-nav transition-[margin-left] duration-200 flex flex-col lg:pt-16',
        isFixedHeightPage ? 'h-full max-h-full min-h-0 overflow-hidden' : 'min-h-full',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
      )}>
        <div className={cn(
          'max-w-content mx-auto w-full px-2 sm:px-4 animate-page-enter flex flex-col',
          isFixedHeightPage ? 'flex-1 min-h-0 overflow-hidden' : 'min-h-full'
        )}>
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
