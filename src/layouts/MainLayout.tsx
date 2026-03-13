import { Outlet, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemo, useEffect } from 'react'
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

const SIDEBAR_PATHS = ['/profile', '/notifications', '/ai', '/payment', '/payment/success', '/payment/cancel', '/support']

function isSidebarPath(pathname: string) {
  return SIDEBAR_PATHS.some((p) => pathname === p || pathname.startsWith('/support/'))
}

export function MainLayout() {
  const { isAuthenticated, role } = useAuth()
  const { t } = useTranslation(['student', 'university', 'admin', 'school'])
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)
  const showSidebar = isAuthenticated && isSidebarPath(location.pathname)

  const { navItems, navBottomItems } = useMemo(() => {
    if (role === 'student') {
      return {
        navItems: [
          { to: '/student/dashboard', label: t('student:dashboard'), icon: 'LayoutDashboard' },
          { to: '/ai', label: t('student:navEdmissionAi'), icon: 'Bot' },
          { to: '/student/profile', label: t('student:navProfile'), icon: 'User' },
          { to: '/student/universities', label: t('student:navUniversities'), icon: 'GraduationCap' },
          { to: '/student/applications', label: t('student:navApplications'), icon: 'FileCheck' },
          { to: '/student/documents', label: t('student:navDocuments'), icon: 'FileText' },
          { to: '/student/offers', label: t('student:navOffers'), icon: 'Gift' },
          { to: '/student/compare', label: t('student:navCompare'), icon: 'GitCompare' },
          { to: '/student/chat', label: t('student:navChat'), icon: 'MessageCircle' },
          { to: '/notifications', label: t('student:navNotifications'), icon: 'Bell' },
          { to: '/payment', label: t('student:navSubscription'), icon: 'CreditCard' },
        ],
        navBottomItems: [
          { to: '/support', label: t('student:navSupport'), icon: 'HelpCircle' },
          { to: '/profile', label: t('student:account', 'Account'), icon: 'Settings' },
        ],
      }
    }
    if (role === 'university') {
      return {
        navItems: [
          { to: '/university/dashboard', label: t('university:dashboard'), icon: 'LayoutDashboard' },
          { to: '/university/ai', label: 'Edmission AI', icon: 'Bot' },
          { to: '/university/profile', label: t('university:navProfile'), icon: 'User' },
          { to: '/university/students', label: t('university:navDiscovery'), icon: 'Users' },
          { to: '/university/pipeline', label: t('university:navPipeline'), icon: 'GitBranch' },
          { to: '/university/scholarships', label: t('university:navScholarships'), icon: 'Wallet' },
          { to: '/university/faculties', label: t('university:navFaculties'), icon: 'Building2' },
          { to: '/university/chat', label: t('university:navChat'), icon: 'MessageCircle' },
          { to: '/notifications', label: t('university:navNotifications', 'Notifications'), icon: 'Bell' },
          { to: '/payment', label: 'Subscription', icon: 'CreditCard' },
        ],
        navBottomItems: [
          { to: '/support', label: 'Support', icon: 'HelpCircle' },
          { to: '/profile', label: t('university:account', 'Account'), icon: 'Settings' },
        ],
      }
    }
    if (role === 'admin') {
      return {
        navItems: [
          { to: '/admin/dashboard', label: t('admin:dashboard'), icon: 'LayoutDashboard' },
          { to: '/ai', label: 'Edmission AI', icon: 'Bot' },
          { to: '/admin/users', label: t('admin:users'), icon: 'Users' },
          { to: '/admin/verification', label: t('admin:verification'), icon: 'ShieldCheck' },
          { to: '/admin/universities', label: t('admin:universityCatalog', 'Universities'), icon: 'Building2' },
          { to: '/admin/university-requests', label: t('admin:universityRequests', 'Requests'), icon: 'Users' },
          { to: '/admin/offers', label: t('admin:offers'), icon: 'Gift' },
          { to: '/admin/logs', label: t('admin:logs'), icon: 'Logs' },
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
          { to: '/school/dashboard', label: t('school:dashboard'), icon: 'LayoutDashboard' },
          { to: '/ai', label: 'Edmission AI', icon: 'Bot' },
          { to: '/school/my-school', label: t('school:mySchool'), icon: 'Building2' },
          { to: '/school/my-students', label: t('school:myStudents'), icon: 'Users' },
          { to: '/school/join-requests', label: t('school:joinRequests'), icon: 'Users' },
          { to: '/notifications', label: t('school:notifications'), icon: 'Bell' },
        ],
        navBottomItems: [
          { to: '/support', label: 'Support', icon: 'HelpCircle' },
          { to: '/profile', label: t('school:account', 'Account'), icon: 'Settings' },
        ],
      }
    }
    return { navItems: [], navBottomItems: [] }
  }, [role, t])

  const bottomNavItems = useMemo(() => {
    if (role === 'student') {
      return [
        { to: '/student/dashboard', label: t('student:navHome'), icon: 'LayoutDashboard' },
        { to: '/student/universities', label: t('student:navExplore'), icon: 'GraduationCap' },
        { to: '/student/applications', label: t('student:navApplications'), icon: 'FileCheck' },
        { to: '/student/profile', label: t('student:navProfile'), icon: 'User' },
        { to: '/student/chat', label: t('student:navChat'), icon: 'MessageCircle' },
      ]
    }
    if (role === 'university') {
      return [
        { to: '/university/dashboard', label: t('university:navHome'), icon: 'LayoutDashboard' },
        { to: '/university/students', label: t('university:navDiscovery'), icon: 'Users' },
        { to: '/university/pipeline', label: t('university:navPipeline'), icon: 'GitBranch' },
        { to: '/university/profile', label: t('university:navProfile'), icon: 'User' },
        { to: '/university/chat', label: t('university:navChat'), icon: 'MessageCircle' },
      ]
    }
    if (role === 'admin') {
      return [
        { to: '/admin/dashboard', label: t('admin:dashboard'), icon: 'LayoutDashboard' },
        { to: '/admin/users', label: t('admin:users'), icon: 'Users' },
        { to: '/admin/offers', label: t('admin:offers'), icon: 'Gift' },
        { to: '/admin/verification', label: t('admin:verification'), icon: 'ShieldCheck' },
        { to: '/admin/university-requests', label: t('admin:universityRequests', 'Requests'), icon: 'Users' },
      ]
    }
    if (role === 'school_counsellor') {
      return [
        { to: '/school/dashboard', label: t('school:dashboard'), icon: 'LayoutDashboard' },
        { to: '/school/my-school', label: t('school:mySchool'), icon: 'Building2' },
        { to: '/school/my-students', label: t('school:myStudents'), icon: 'Users' },
        { to: '/school/join-requests', label: t('school:joinRequests'), icon: 'Users' },
      ]
    }
    return []
  }, [role, t])

  useEffect(() => {
    if (showSidebar) setNavItems([...navItems, ...navBottomItems])
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
    <div className="min-h-screen bg-[var(--color-bg)]">
      {isAuthenticated && <TopBar />}
      {showSidebar && navItems.length > 0 ? (
        <div className="flex">
          <Sidebar items={navItems} bottomItems={navBottomItems} />
          <div className={cn('flex-1 min-w-0 pb-20 md:pb-0 transition-[margin-left] duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar')}>
            <main className="p-3 sm:p-4 min-h-[calc(100vh-4rem)]">
              <div className="max-w-content mx-auto w-full">
                <Suspense fallback={<ContentFallback />}>
                  <Outlet />
                </Suspense>
              </div>
            </main>
          </div>
          <BottomNav items={bottomNavItems} />
        </div>
      ) : (
        <main className="p-3 sm:p-4 min-h-[calc(100vh-4rem)]">
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
        </main>
      )}
      {isAuthenticated && <FloatingAIButton />}
      <VersionBadge />
      <CookieConsentBanner />
    </div>
  )
}
