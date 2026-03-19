import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { RoleOnboardingController } from '@/components/onboarding/RoleOnboardingController'
import { cn } from '@/utils/cn'
import { ContentFallback } from '@/components/layout/ContentFallback'

export function UniversityLayout() {
  const { user } = useAuth()
  const { t } = useTranslation(['university', 'common'])
  const location = useLocation()
  const isSelect = location.pathname === '/university/select'
  const isPending = location.pathname === '/university/pending'
  const isFixedHeightPage = location.pathname === '/university/ai' || location.pathname === '/university/chat'

  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)

  const navItems = useMemo(
    () =>
      isSelect || isPending
        ? [
            { to: '/university/select', label: t('selectUniversity', 'Select university'), icon: 'Building2' },
            { to: '/university/pending', label: t('status', 'Status'), icon: 'Clock' },
          ]
        : [
            { to: '/university/dashboard', label: t('dashboard', 'Dashboard'), icon: 'LayoutDashboard' },
            { to: '/university/profile', label: t('navProfile', 'Profile'), icon: 'User' },
            { to: '/university/students', label: t('navDiscovery', 'Discovery'), icon: 'Users' },
            { to: '/university/pipeline', label: t('navPipeline', 'Pipeline'), icon: 'GitBranch' },
            { to: '/university/documents', label: t('common:documents', 'Documents'), icon: 'FileText' },
            { to: '/university/scholarships', label: t('navScholarships', 'Scholarships'), icon: 'Wallet' },
            { to: '/university/faculties', label: t('navFaculties', 'Faculties'), icon: 'Building2' },
            { to: '/university/analytics', label: t('navAnalytics', 'Analytics'), icon: 'BarChart3' },
            { to: '/university/chat', label: t('navChat', 'Chat'), icon: 'MessageCircle' },
            { to: '/notifications', label: t('navNotifications', 'Notifications'), icon: 'Bell' },
            { to: '/payment', label: t('navSubscription', 'Subscription'), icon: 'CreditCard' },
            { to: '/university/ai', label: t('common:edmissionAi', 'Edmission AI'), icon: 'Bot' },
          ],
    [t, isSelect, isPending]
  )
  const navBottomItems = useMemo(
    () =>
      isSelect || isPending
        ? [{ to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' }]
        : [
            { to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' },
            { to: '/profile', label: t('account', 'Account'), icon: 'Settings' },
          ],
    [t, isSelect, isPending]
  )
  const bottomNavItems = useMemo(
    () =>
      isSelect || isPending
        ? [
            { to: '/university/select', label: t('selectUniversity', 'Select'), icon: 'Building2' },
            { to: '/university/pending', label: t('status', 'Status'), icon: 'Clock' },
            { to: '/support', label: 'Support', icon: 'HelpCircle' },
          ]
        : [
            { to: '/university/dashboard', label: t('navHome', 'Home'), icon: 'LayoutDashboard' },
            { to: '/university/students', label: t('navDiscovery', 'Discovery'), icon: 'Users' },
            { to: '/university/profile', label: t('navProfile', 'Profile'), icon: 'User' },
            { to: '/university/chat', label: t('navChat', 'Chat'), icon: 'MessageCircle' },
          ],
    [t, isSelect, isPending]
  )
  useEffect(() => {
    setNavItems([...navItems, ...navBottomItems])
    return () => setNavItems(null)
  }, [navItems, navBottomItems, setNavItems])

  if (user?.role === 'university' && !isSelect && !isPending) {
    if (!user?.universityProfile) return <Navigate to="/university/select" replace />
    if (!user.universityProfile.verified) return <Navigate to="/university/pending" replace />
  }

  return (
    <div className="flex min-h-full items-start">
      <RoleOnboardingController role="university" />
      <Sidebar items={navItems} bottomItems={navBottomItems} />
      <div className={cn(
        'flex-1 min-w-0 pb-20 md:pb-12 transition-[margin-left] duration-200 bg-pattern-subtle flex flex-col',
        isFixedHeightPage ? 'h-screen max-h-[100%] overflow-hidden' : 'min-h-screen',
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
