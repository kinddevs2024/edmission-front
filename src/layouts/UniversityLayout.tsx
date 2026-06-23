import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom'
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
import { getActAsUniversityUserId, clearActAsUniversityUserId } from '@/constants/actAsUniversity'
import { Button } from '@/components/ui/Button'

export function UniversityLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation(['university', 'common'])
  const location = useLocation()
  const actingUniversityUserId = typeof sessionStorage !== 'undefined' ? getActAsUniversityUserId() : null
  const isMultiUniversityRole = user?.role === 'university_multi_manager' || user?.role === 'multi_university_admin'
  const isDelegatedSession = isMultiUniversityRole && Boolean(actingUniversityUserId)
  const isSelect = location.pathname === '/university/select'
  const isPending = location.pathname === '/university/pending'
  const isChatPage = location.pathname === '/university/chat'
  const isFixedHeightPage = isChatPage

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
            {
              to: '/university/dashboard',
              label: t('dashboard', 'Dashboard'),
              icon: 'LayoutDashboard',
              section: t('navSectionMain', 'Main'),
            },
            { to: '/university/profile', label: t('navProfile', 'Profile'), icon: 'User' },
            {
              to: '/university/students',
              label: t('navDiscovery', 'Discovery'),
              icon: 'Users',
              section: t('navSectionRecruitment', 'Recruitment'),
            },
            { to: '/university/students/map', label: t('navStudentMap', 'Student map'), icon: 'Map' },
            { to: '/university/pipeline', label: t('navPipeline', 'Pipeline'), icon: 'GitBranch' },
            { to: '/university/chat', label: t('navChat', 'Chat'), icon: 'MessageCircle' },
            {
              to: '/university/documents',
              label: t('university:navDocuments', 'Documents'),
              icon: 'FileText',
              section: t('navSectionCatalog', 'Programs & catalog'),
            },
            { to: '/university/flyers', label: t('navFlyers', 'Flyers'), icon: 'Image' },
            { to: '/university/scholarships', label: t('navScholarships', 'Scholarships'), icon: 'Wallet' },
            { to: '/university/faculties', label: t('navFaculties', 'Faculties'), icon: 'Building2' },
            { to: '/university/analytics', label: t('navAnalytics', 'Analytics'), icon: 'BarChart3' },
            {
              to: '/notifications',
              label: t('navNotifications', 'Notifications'),
              icon: 'Bell',
              section: t('navSectionMore', 'More'),
            },
          ],
    [t, isSelect, isPending]
  )
  const navBottomItems = useMemo(
    () =>
      isSelect || isPending
        ? [{ to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' }]
        : [
            { to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' },
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

  if (isMultiUniversityRole && !isSelect && !isPending && !actingUniversityUserId) {
    return <Navigate to="/university-multi-manager" replace />
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1">
      {(user?.role === 'university' || isDelegatedSession) ? <RoleOnboardingController role="university" /> : null}
      <Sidebar items={navItems} bottomItems={navBottomItems} />
      <div className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col pt-3 sm:pt-4 transition-[margin-left] duration-200',
        isFixedHeightPage
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden pb-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:pt-16'
          : 'h-full pb-mobile-nav lg:pt-16',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
      )}>
        <div
          className={cn(
            'mx-auto flex w-full flex-col',
            isChatPage
              ? 'h-full min-h-0 flex-1 max-w-none overflow-hidden px-0 sm:px-0'
              : 'max-w-content px-2 sm:px-4',
            isFixedHeightPage ? 'h-full min-h-0 flex-1 overflow-hidden' : 'min-h-0 flex-1'
          )}
        >
          {isDelegatedSession ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-input border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
              <span className="text-[var(--color-text)]">
                {t('university:delegatedSessionBanner', 'You are working on behalf of a linked university account.')}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  clearActAsUniversityUserId()
                  navigate('/university-multi-manager')
                }}
              >
                {t('university:exitDelegatedSession', 'Back to university list')}
              </Button>
            </div>
          ) : null}
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
