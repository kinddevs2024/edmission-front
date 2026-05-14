import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { FloatingAIButton } from '@/components/ai/FloatingAIButton'
import { ElevenLabsSupportProvider } from '@/components/ai/ElevenLabsSupport'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { cn } from '@/utils/cn'
import { ContentFallback } from '@/components/layout/ContentFallback'
import { useAutoReadNotifications } from '@/hooks/useAutoReadNotifications'
import { buildStudentNavigation } from '@/navigation/studentNav'

const SIDEBAR_PATHS = ['/profile', '/notifications', '/ai', '/payment', '/payment/success', '/payment/cancel', '/support']

function isSidebarPath(pathname: string) {
  return SIDEBAR_PATHS.some((p) => pathname === p || pathname.startsWith('/support/'))
}

export function MainLayout() {
  const { isAuthenticated, role, user } = useAuth()
  const { t } = useTranslation(['student', 'university', 'admin', 'common'])
  const { t: tSchool } = useTranslation('school')
  const location = useLocation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const collapsed = useUIStore((s) => s.sidebarCollapsed)

  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0)
    scrollContainerRef.current?.querySelector('main')?.scrollTo(0, 0)
  }, [location.pathname])
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)
  const showSidebar = isAuthenticated && isSidebarPath(location.pathname)
  const isChatPage = location.pathname === '/student/chat' || location.pathname === '/university/chat' || location.pathname === '/school/chats'

  useAutoReadNotifications(role ?? null, isAuthenticated)

  const { navItems, navBottomItems } = useMemo(() => {
    const educationStatus = user?.studentProfile?.educationStatus as
      | 'in_school'
      | 'finished_school'
      | string
      | undefined
    const counsellorLinked = Boolean((user?.studentProfile as { counsellorUserId?: string } | undefined)?.counsellorUserId)
    const showMySchools =
      (educationStatus === 'in_school' || educationStatus === 'finished_school') && !counsellorLinked

    if (role === 'student') {
      const built = buildStudentNavigation(
        (key, defaultValue) => t(`student:${key}`, { defaultValue: defaultValue ?? key }),
        { showMySchools }
      )
      return { navItems: built.sidebarItems, navBottomItems: built.sidebarBottomItems }
    }
    if (role === 'university_multi_manager' || role === 'multi_university_admin') {
      return {
        navItems: [
          { to: '/university-multi-manager', label: role === 'multi_university_admin' ? t('university:multiUniversityAdminTitle', 'All universities') : t('university:multiManagerTitle', 'Your universities'), icon: 'Building2' },
          { to: '/notifications', label: t('university:navNotifications', 'Notifications'), icon: 'Bell' },
          { to: '/ai', label: t('common:edmissionAi', 'Edmission AI'), icon: 'Bot' },
        ],
        navBottomItems: [
          { to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' },
          { to: '/profile', label: t('university:navProfile', 'Profile'), icon: 'Settings' },
        ],
      }
    }
    if (role === 'university') {
      return {
        navItems: [
          {
            to: '/university/dashboard',
            label: t('university:dashboard', 'Dashboard'),
            icon: 'LayoutDashboard',
            section: t('university:navSectionMain', 'Main'),
          },
          { to: '/university/profile', label: t('university:navProfile', 'Profile'), icon: 'User' },
          {
            to: '/university/students',
            label: t('university:navDiscovery', 'Discovery'),
            icon: 'Users',
            section: t('university:navSectionRecruitment', 'Recruitment'),
          },
          { to: '/university/students/map', label: t('university:navStudentMap', 'Student map'), icon: 'Map' },
          { to: '/university/pipeline', label: t('university:navPipeline', 'Pipeline'), icon: 'GitBranch' },
          { to: '/university/chat', label: t('university:navChat', 'Chat'), icon: 'MessageCircle' },
          {
            to: '/university/documents',
            label: t('university:navDocuments', 'Documents'),
            icon: 'FileText',
            section: t('university:navSectionCatalog', 'Programs & catalog'),
          },
          { to: '/university/flyers', label: t('university:navFlyers', 'Flyers'), icon: 'Image' },
          { to: '/university/scholarships', label: t('university:navScholarships', 'Scholarships'), icon: 'Wallet' },
          { to: '/university/faculties', label: t('university:navFaculties', 'Faculties'), icon: 'Building2' },
          { to: '/university/analytics', label: t('university:navAnalytics', 'Analytics'), icon: 'BarChart3' },
          {
            to: '/notifications',
            label: t('university:navNotifications', 'Notifications'),
            icon: 'Bell',
            section: t('university:navSectionMore', 'More'),
          },
          { to: '/university/ai', label: t('common:edmissionAi', 'Edmission AI'), icon: 'Bot' },
        ],
        navBottomItems: [
          { to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' },
          { to: '/profile', label: t('university:navProfile', 'Profile'), icon: 'Settings' },
        ],
      }
    }
    if (role === 'admin' || role === 'manager' || role === 'counsellor_coordinator') {
      const isFullAdmin = role === 'admin'
      return {
        navItems: isFullAdmin
          ? [
              { to: '/admin/dashboard', label: t('admin:dashboard'), icon: 'LayoutDashboard' },
              { to: '/admin/analytics', label: t('admin:analytics', 'Analytics'), icon: 'BarChart3' },
              { to: '/admin/users', label: t('admin:users'), icon: 'Users' },
              { to: '/admin/verification', label: t('admin:verification'), icon: 'ShieldCheck' },
              { to: '/admin/universities', label: t('admin:universityCatalog', 'Universities'), icon: 'Building2' },
              { to: '/admin/faculties', label: t('admin:faculties', 'Faculties'), icon: 'GraduationCap' },
              { to: '/admin/university-requests', label: t('admin:universityRequests', 'Requests'), icon: 'Users' },
              { to: '/admin/investors', label: t('admin:investors', 'Investors'), icon: 'Building2' },
              { to: '/admin/landing-certificates', label: t('admin:landingCertificates', 'Landing Certificates'), icon: 'Award' },
              { to: '/admin/offers', label: t('admin:offers'), icon: 'Gift' },
              { to: '/admin/interests', label: t('admin:interests', 'Interests'), icon: 'Heart' },
              { to: '/admin/chats', label: t('admin:chats', 'Chats'), icon: 'MessageCircle' },
              { to: '/admin/scholarships', label: t('admin:scholarships', 'Scholarships'), icon: 'Wallet' },
              { to: '/admin/logs', label: t('admin:logs'), icon: 'Logs' },
              { to: '/admin/health', label: t('admin:systemHealth', 'System health'), icon: 'Activity' },
              { to: '/admin/ai', label: t('common:edmissionAi', 'Edmission AI'), icon: 'Bot' },
            ]
          : [
              { to: '/admin/dashboard', label: t('admin:dashboard'), icon: 'LayoutDashboard' },
              { to: '/admin/users', label: t('admin:users'), icon: 'Users' },
              { to: '/admin/interests', label: t('admin:interests', 'Interests'), icon: 'Heart' },
              { to: '/admin/ai', label: t('common:edmissionAi', 'Edmission AI'), icon: 'Bot' },
            ],
        navBottomItems: [
          { to: '/admin/support', label: t('admin:support'), icon: 'HelpCircle' },
          ...(isFullAdmin ? [{ to: '/admin/settings', label: t('admin:settings.title', 'Settings'), icon: 'Settings' as const }] : []),
        ],
      }
    }
    if (role === 'school_counsellor') {
      return {
        navItems: [
          { to: '/school/dashboard', label: tSchool('dashboard'), icon: 'LayoutDashboard' },
          { to: '/ai', label: t('common:edmissionAi', 'Edmission AI'), icon: 'Bot' },
          { to: '/school/my-school', label: tSchool('mySchool'), icon: 'Building2' },
          { to: '/school/my-students', label: tSchool('myStudents'), icon: 'Users' },
          { to: '/school/my-students/map', label: tSchool('studentMap', 'Student map'), icon: 'Map' },
          { to: '/school/student-interests', label: tSchool('studentInterestsNav', 'Student interests'), icon: 'HeartHandshake' },
          { to: '/school/applications', label: tSchool('applications', 'Applications'), icon: 'Heart' },
          { to: '/school/offers', label: tSchool('offers', 'Offers'), icon: 'Gift' },
          { to: '/school/chats', label: tSchool('chats', 'Chats'), icon: 'MessageCircle' },
          { to: '/school/join-requests', label: tSchool('joinRequests'), icon: 'Users' },
          { to: '/notifications', label: tSchool('notifications'), icon: 'Bell' },
        ],
        navBottomItems: [
          { to: '/support', label: t('common:support', 'Support'), icon: 'HelpCircle' },
          { to: '/profile', label: tSchool('profile', 'Profile'), icon: 'Settings' },
        ],
      }
    }
    return { navItems: [], navBottomItems: [] }
  }, [role, t, user?.studentProfile, tSchool])

  const bottomNavItems = useMemo(() => {
    if (role === 'student') {
      const showMySchools =
        (user?.studentProfile?.educationStatus === 'in_school' ||
          user?.studentProfile?.educationStatus === 'finished_school') &&
        !Boolean((user?.studentProfile as { counsellorUserId?: string } | undefined)?.counsellorUserId)
      return buildStudentNavigation(
        (key, defaultValue) => t(`student:${key}`, { defaultValue: defaultValue ?? key }),
        { showMySchools }
      ).bottomNavItems
    }
    if (role === 'university_multi_manager' || role === 'multi_university_admin') {
      return [
        { to: '/university-multi-manager', label: role === 'multi_university_admin' ? t('university:multiUniversityAdminTitle', 'Universities') : t('university:multiManagerTitle', 'Universities'), icon: 'Building2' },
        { to: '/profile', label: t('university:navProfile', 'Profile'), icon: 'Settings' },
        { to: '/notifications', label: t('university:navNotifications', 'Notifications'), icon: 'Bell' },
      ]
    }
    if (role === 'university') {
      return [
        { to: '/university/dashboard', label: t('university:navHome', 'Home'), icon: 'LayoutDashboard' },
        { to: '/university/students', label: t('university:navDiscovery', 'Discovery'), icon: 'Users' },
        { to: '/university/profile', label: t('university:navProfile', 'Profile'), icon: 'User' },
        { to: '/university/chat', label: t('university:navChat', 'Chat'), icon: 'MessageCircle' },
      ]
    }
    if (role === 'admin' || role === 'manager' || role === 'counsellor_coordinator') {
      const isFullAdmin = role === 'admin'
      return [
        { to: '/admin/dashboard', label: t('admin:dashboard'), icon: 'LayoutDashboard' },
        { to: '/admin/users', label: t('admin:users'), icon: 'Users' },
        ...(isFullAdmin ? [{ to: '/admin/analytics', label: t('admin:analytics', 'Analytics'), icon: 'BarChart3' as const }] : [{ to: '/admin/interests', label: t('admin:interests', 'Interests'), icon: 'Heart' as const }]),
        { to: '/admin/offers', label: t('admin:offers'), icon: 'Gift' },
        { to: '/admin/support', label: t('admin:support'), icon: 'HelpCircle' },
      ]
    }
    if (role === 'school_counsellor') {
      return [
        { to: '/school/dashboard', label: tSchool('dashboard'), icon: 'LayoutDashboard' },
        { to: '/school/my-school', label: tSchool('mySchool'), icon: 'Building2' },
        { to: '/school/my-students', label: tSchool('myStudents'), icon: 'Users' },
        { to: '/school/student-interests', label: tSchool('studentInterestsNav', 'Student interests'), icon: 'HeartHandshake' },
        { to: '/school/applications', label: tSchool('applications', 'Applications'), icon: 'Heart' },
        { to: '/school/offers', label: tSchool('offers', 'Offers'), icon: 'Gift' },
        { to: '/school/chats', label: tSchool('chats', 'Chats'), icon: 'MessageCircle' },
      ]
    }
    return []
  }, [role, t, tSchool, user?.studentProfile])

  // Only own mobile nav when /profile, /notifications, /ai, etc. For role layouts (student/*, …)
  // never clear here — their useEffect would lose the race and navItems stay null (hamburger hidden).
  useEffect(() => {
    if (!showSidebar) return
    setNavItems([...navItems, ...navBottomItems])
    return () => setNavItems(null)
  }, [showSidebar, navItems, navBottomItems, setNavItems])

  useEffect(() => {
    if (!isAuthenticated) return
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      const t = setTimeout(() => {
        Notification.requestPermission().catch(() => {})
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [isAuthenticated])

  return (
    <ElevenLabsSupportProvider>
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
      {isAuthenticated && <TopBar />}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex min-h-0 flex-1 flex-col bg-transparent',
          isChatPage ? 'overflow-hidden' : 'overflow-auto'
        )}
      >
        {showSidebar && navItems.length > 0 ? (
          <div className="flex h-full min-h-0 min-w-0 w-full flex-1">
          <Sidebar items={navItems} bottomItems={navBottomItems} />
          <div
            className={cn(
              'flex h-full min-h-0 min-w-0 flex-1 flex-col pb-mobile-nav transition-[margin-left] duration-200 lg:pt-16',
              collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
            )}
          >
            <main className="flex h-full min-h-0 flex-1 flex-col overflow-auto bg-transparent p-3 pb-6 sm:p-4 md:pb-12">
              <div className="max-w-content mx-auto flex min-h-0 w-full flex-col">
                <Suspense fallback={<ContentFallback />}>
                  <Outlet />
                </Suspense>
              </div>
            </main>
          </div>
          <BottomNav items={bottomNavItems} />
          </div>
        ) : (
          <main
            className={cn(
              'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col bg-transparent p-2 pb-mobile-nav sm:p-2 md:pb-12',
              isChatPage && 'overflow-hidden'
            )}
          >
            <div
              className={cn(
                'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col',
                isChatPage && 'overflow-hidden'
              )}
            >
              <Suspense fallback={<ContentFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        )}
      </div>
      {isAuthenticated && <FloatingAIButton />}
      <CookieConsentBanner />
    </div>
    </ElevenLabsSupportProvider>
  )
}
