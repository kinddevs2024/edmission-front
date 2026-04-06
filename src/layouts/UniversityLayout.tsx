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
  const { t } = useTranslation('university')
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
            { to: '/university/documents', label: 'Documents', icon: 'FileText' },
            { to: '/university/flyers', label: t('navFlyers', 'Flyers'), icon: 'Image' },
            { to: '/university/scholarships', label: t('navScholarships', 'Scholarships'), icon: 'Wallet' },
            { to: '/university/faculties', label: t('navFaculties', 'Faculties'), icon: 'Building2' },
            { to: '/university/analytics', label: t('navAnalytics', 'Analytics'), icon: 'BarChart3' },
            { to: '/university/chat', label: t('navChat', 'Chat'), icon: 'MessageCircle' },
            { to: '/notifications', label: t('navNotifications', 'Notifications'), icon: 'Bell' },
            { to: '/university/ai', label: 'Edmission AI', icon: 'Bot' },
          ],
    [t, isSelect, isPending]
  )
  const navBottomItems = useMemo(
    () =>
      isSelect || isPending
        ? [{ to: '/support', label: 'Support', icon: 'HelpCircle' }]
        : [
            { to: '/support', label: 'Support', icon: 'HelpCircle' },
            { to: '/profile', label: t('navProfile', 'Profile'), icon: 'Settings' },
          ],
    [t, isSelect, isPending]
  )
  const bottomNavItems = useMemo(
    () =>
      isSelect || isPending
        ? [
            { to: '/university/select', label: t('selectUniversity', 'Select'), icon: 'Building2' },
            { to: '/university/pending', label: t('status', 'Status'), icon: 'Clock' },
            { to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' },
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
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1">
      <RoleOnboardingController role="university" />
      <Sidebar items={navItems} bottomItems={navBottomItems} />
      <div className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col transition-[margin-left] duration-200',
        isFixedHeightPage
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden pb-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:pt-16'
          : 'h-full pb-mobile-nav lg:pt-16',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
      )}>
        <div className={cn(
          'max-w-content mx-auto flex w-full flex-col px-2 animate-page-enter sm:px-4',
          isFixedHeightPage ? 'h-full min-h-0 flex-1 overflow-hidden' : 'min-h-0 flex-1'
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
