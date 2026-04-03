import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { FloatingAIButton } from '@/components/ai/FloatingAIButton'
import { VersionBadge } from '@/components/VersionBadge'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { cn } from '@/utils/cn'
import { ContentFallback } from '@/components/layout/ContentFallback'
import { useAutoReadNotifications } from '@/hooks/useAutoReadNotifications'

const SIDEBAR_PATHS = ['/profile', '/notifications', '/ai', '/payment', '/payment/success', '/payment/cancel', '/support']

function isSidebarPath(pathname: string) {
  return SIDEBAR_PATHS.some((p) => pathname === p || pathname.startsWith('/support/'))
}

export function MainLayout() {
  const { isAuthenticated, role, user } = useAuth()
  const { t } = useTranslation(['student', 'university', 'admin'])
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
  const isChatPage = location.pathname === '/student/chat' || location.pathname === '/university/chat'

  useAutoReadNotifications(role ?? null, isAuthenticated)

  const { navItems, navBottomItems } = useMemo(() => {
    const educationStatus = user?.studentProfile?.educationStatus as
      | 'in_school'
      | 'finished_school'
      | string
      | undefined
    const showMySchools = educationStatus === 'in_school' || educationStatus === 'finished_school'

    if (role === 'student') {
      return {
        navItems: [
        { to: '/student/dashboard', label: t('student:dashboard', 'Dashboard'), icon: 'LayoutDashboard' },
        { to: '/student/ai', label: t('student:navEdmissionAi', 'Edmission AI'), icon: 'Bot' },
        { to: '/student/profile', label: t('student:navProfile', 'Profile'), icon: 'User' },
        { to: '/student/universities', label: t('student:navUniversities', 'Universities'), icon: 'GraduationCap' },
        ...(showMySchools
          ? [{ to: '/student/schools', label: t('student:navMySchool', 'My school'), icon: 'Building2' as const }]
          : []),
        { to: '/student/applications', label: t('student:navApplications', 'Applications'), icon: 'FileCheck' },
        { to: '/student/documents', label: t('student:navDocuments', 'Documents'), icon: 'FileText' },
        { to: '/student/offers', label: t('student:navOffers', 'Offers'), icon: 'Gift' },
        { to: '/student/compare', label: t('student:navCompare', 'Compare'), icon: 'GitCompare' },
        { to: '/student/chat', label: t('student:navChat', 'Chat'), icon: 'MessageCircle' },
        { to: '/notifications', label: t('student:navNotifications', 'Notifications'), icon: 'Bell' },
        { to: '/payment', label: t('student:navSubscription', 'Subscription'), icon: 'CreditCard' },
        ],
        navBottomItems: [
        { to: '/support', label: t('student:navSupport', 'Support'), icon: 'HelpCircle' },
          { to: '/profile', label: t('student:navProfile', 'Profile'), icon: 'Settings' },
        ],
      }
    }
    if (role === 'university') {
      return {
        navItems: [
        { to: '/university/dashboard', label: t('university:dashboard', 'Dashboard'), icon: 'LayoutDashboard' },
        { to: '/university/profile', label: t('university:navProfile', 'Profile'), icon: 'User' },
        { to: '/university/students', label: t('university:navDiscovery', 'Discovery'), icon: 'Users' },
        { to: '/university/pipeline', label: t('university:navPipeline', 'Pipeline'), icon: 'GitBranch' },
        { to: '/university/documents', label: 'Documents', icon: 'FileText' },
        { to: '/university/flyers', label: t('university:navFlyers', 'Flyers'), icon: 'Image' },
        { to: '/university/scholarships', label: t('university:navScholarships', 'Scholarships'), icon: 'Wallet' },
        { to: '/university/faculties', label: t('university:navFaculties', 'Faculties'), icon: 'Building2' },
        { to: '/university/analytics', label: t('university:navAnalytics', 'Analytics'), icon: 'BarChart3' },
        { to: '/university/chat', label: t('university:navChat', 'Chat'), icon: 'MessageCircle' },
        { to: '/notifications', label: t('university:navNotifications', 'Notifications'), icon: 'Bell' },
        { to: '/payment', label: t('university:navSubscription', 'Subscription'), icon: 'CreditCard' },
        { to: '/university/ai', label: 'Edmission AI', icon: 'Bot' },
        ],
        navBottomItems: [
        { to: '/support', label: 'Support', icon: 'HelpCircle' },
          { to: '/profile', label: t('university:navProfile', 'Profile'), icon: 'Settings' },
        ],
      }
    }
    if (role === 'admin') {
      return {
        navItems: [
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
          { to: '/admin/ai', label: 'Edmission AI', icon: 'Bot' },
        ],
        navBottomItems: [
          { to: '/admin/support', label: t('admin:support'), icon: 'HelpCircle' },
          { to: '/admin/settings', label: t('admin:settings.title', 'Settings'), icon: 'Settings' },
        ],
      }
    }
    if (role === 'school_counsellor') {
      return {
        navItems: [
          { to: '/school/dashboard', label: tSchool('dashboard'), icon: 'LayoutDashboard' },
          { to: '/ai', label: 'Edmission AI', icon: 'Bot' },
          { to: '/school/my-school', label: tSchool('mySchool'), icon: 'Building2' },
          { to: '/school/my-students', label: tSchool('myStudents'), icon: 'Users' },
          { to: '/school/student-interests', label: tSchool('studentInterestsNav', 'Student interests'), icon: 'HeartHandshake' },
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
      return [
        { to: '/student/dashboard', label: t('student:navHome', 'Home'), icon: 'LayoutDashboard' },
        { to: '/student/applications', label: t('student:navApplications', 'Applications'), icon: 'FileCheck' },
        { to: '/student/universities', label: t('student:navExplore', 'Explore'), icon: 'GraduationCap' },
        { to: '/student/chat', label: t('student:navChat', 'Chat'), icon: 'MessageCircle' },
        { to: '/student/profile', label: t('student:navProfile', 'Profile'), icon: 'User' },
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
    if (role === 'admin') {
      return [
        { to: '/admin/dashboard', label: t('admin:dashboard'), icon: 'LayoutDashboard' },
        { to: '/admin/analytics', label: t('admin:analytics', 'Analytics'), icon: 'BarChart3' },
        { to: '/admin/users', label: t('admin:users'), icon: 'Users' },
        { to: '/admin/offers', label: t('admin:offers'), icon: 'Gift' },
        { to: '/admin/support', label: t('admin:support'), icon: 'HelpCircle' },
      ]
    }
    if (role === 'school_counsellor') {
      return [
        { to: '/school/dashboard', label: tSchool('dashboard'), icon: 'LayoutDashboard' },
        { to: '/school/my-school', label: tSchool('mySchool'), icon: 'Building2' },
        { to: '/school/my-students', label: tSchool('myStudents'), icon: 'Users' },
        { to: '/school/join-requests', label: tSchool('joinRequests'), icon: 'Users' },
      ]
    }
    return []
  }, [role, t, tSchool])

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
    <div className="flex flex-1 flex-col min-h-0 h-screen max-h-screen overflow-hidden bg-[var(--color-bg)]">
      {isAuthenticated && <TopBar />}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex-1 min-h-0 flex flex-col',
          isChatPage ? 'overflow-hidden' : 'overflow-auto'
        )}
      >
        {showSidebar && navItems.length > 0 ? (
          <div className="flex h-full min-h-0">
          <Sidebar items={navItems} bottomItems={navBottomItems} />
          <div className={cn('flex-1 min-w-0 min-h-0 pb-mobile-nav transition-[margin-left] duration-200 flex flex-col bg-pattern-subtle', collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar')}>
            <main className="p-3 sm:p-4 pb-6 md:pb-12 flex-1 min-h-0 flex flex-col overflow-auto bg-pattern-subtle">
              <div className="max-w-content mx-auto w-full min-h-0 flex flex-col">
                <Suspense fallback={<ContentFallback />}>
                  <Outlet />
                </Suspense>
              </div>
            </main>
          </div>
          <BottomNav items={bottomNavItems} />
          </div>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col p-2 sm:p-2 pb-mobile-nav md:pb-12 bg-pattern-subtle">
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
              <Suspense fallback={<ContentFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        )}
      </div>
      {isAuthenticated && <FloatingAIButton />}
      <VersionBadge />
      <CookieConsentBanner />
    </div>
  )
}
