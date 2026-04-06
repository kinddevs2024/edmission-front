import { Outlet, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { RoleOnboardingController } from '@/components/onboarding/RoleOnboardingController'
import { cn } from '@/utils/cn'
import { ContentFallback } from '@/components/layout/ContentFallback'

export function StudentLayout() {
  const { t } = useTranslation('student')
  const { user } = useAuth()
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)
  const educationStatus = user?.studentProfile?.educationStatus
  const counsellorLinked = Boolean((user?.studentProfile as { counsellorUserId?: string } | undefined)?.counsellorUserId)
  const showMySchools =
    (educationStatus === 'in_school' || educationStatus === 'finished_school') && !counsellorLinked

  const isFixedHeightPage = location.pathname === '/student/ai' || location.pathname === '/student/chat'

  const navItems = useMemo(() => {
    const base = [
      { to: '/student/dashboard', label: t('dashboard', 'Dashboard'), icon: 'LayoutDashboard' },
      { to: '/student/ai', label: t('navEdmissionAi', 'Edmission AI'), icon: 'Bot' },
      { to: '/student/profile', label: t('navProfile', 'Profile'), icon: 'User' },
      { to: '/student/universities', label: t('navUniversities', 'Universities'), icon: 'GraduationCap' },
      ...(showMySchools ? [{ to: '/student/schools', label: t('navMySchool', 'My school'), icon: 'Building2' as const }] : []),
      { to: '/student/interests', label: t('navApplications', 'My interests'), icon: 'Heart' },
      { to: '/student/documents', label: t('navDocuments', 'Documents'), icon: 'FileText' },
      { to: '/student/offers', label: t('navOffers', 'Offers'), icon: 'Gift' },
      { to: '/student/compare', label: t('navCompare', 'Compare'), icon: 'GitCompare' },
      { to: '/student/chat', label: t('navChat', 'Chat'), icon: 'MessageCircle' },
      { to: '/notifications', label: t('navNotifications', 'Notifications'), icon: 'Bell' },
    ]
    return base
  }, [t, showMySchools])
  const navBottomItems = useMemo(
    () => [
      { to: '/support', label: t('navSupport'), icon: 'HelpCircle' },
      { to: '/profile', label: t('navProfile', 'Profile'), icon: 'Settings' },
    ],
    [t]
  )
  // Mobile bottom bar: HOME → APPLICATIONS → CATALOG (center) → CHAT → PROFILE (end)
  const bottomNavItems = useMemo(
    () => [
      { to: '/student/dashboard', label: t('navHome', 'Home'), icon: 'LayoutDashboard' },
      { to: '/student/interests', label: t('navApplications', 'My interests'), icon: 'Heart' },
      { to: '/student/universities', label: t('navExplore', 'Explore'), icon: 'GraduationCap' },
      { to: '/student/chat', label: t('navChat', 'Chat'), icon: 'MessageCircle' },
      { to: '/student/profile', label: t('navProfile', 'Profile'), icon: 'User' },
    ],
    [t]
  )
  useEffect(() => {
    setNavItems([...navItems, ...navBottomItems])
    return () => setNavItems(null)
  }, [navItems, navBottomItems, setNavItems])

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1">
      <RoleOnboardingController role="student" />
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
