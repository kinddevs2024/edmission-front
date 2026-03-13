import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useMobileMenuStore } from '@/store/mobileMenuStore'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/utils/cn'

export function StudentLayout() {
  const { t } = useTranslation('student')
  const { user } = useAuth()
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed)
  const setNavItems = useMobileMenuStore((s) => s.setNavItems)
  const educationStatus = user?.studentProfile?.educationStatus
  const showMySchools = educationStatus === 'in_school' || educationStatus === 'finished_school'

  useEffect(() => {
    if (location.pathname === '/student/chat' && collapsed) setSidebarCollapsed(false)
  }, [location.pathname, collapsed, setSidebarCollapsed])

  const navItems = useMemo(() => {
    const base = [
      { to: '/student/dashboard', label: t('dashboard'), icon: 'LayoutDashboard' },
      { to: '/student/ai', label: t('navEdmissionAi'), icon: 'Bot' },
      { to: '/student/profile', label: t('navProfile'), icon: 'User' },
      { to: '/student/universities', label: t('navUniversities'), icon: 'GraduationCap' },
      ...(showMySchools ? [{ to: '/student/schools', label: t('navMySchool', 'My school'), icon: 'Building2' as const }] : []),
      { to: '/student/applications', label: t('navApplications'), icon: 'FileCheck' },
      { to: '/student/documents', label: t('navDocuments'), icon: 'FileText' },
      { to: '/student/offers', label: t('navOffers'), icon: 'Gift' },
      { to: '/student/compare', label: t('navCompare'), icon: 'GitCompare' },
      { to: '/student/chat', label: t('navChat'), icon: 'MessageCircle' },
      { to: '/notifications', label: t('navNotifications'), icon: 'Bell' },
      { to: '/payment', label: t('navSubscription'), icon: 'CreditCard' },
    ]
    return base
  }, [t, showMySchools])
  const navBottomItems = useMemo(
    () => [
      { to: '/support', label: t('navSupport'), icon: 'HelpCircle' },
      { to: '/profile', label: t('account', 'Account'), icon: 'Settings' },
    ],
    [t]
  )
  // Mobile bottom bar: HOME → EXPLORE → PROFILES → CHAT (no AI, no Support)
  const bottomNavItems = useMemo(
    () => [
      { to: '/student/dashboard', label: t('navHome'), icon: 'LayoutDashboard' },
      { to: '/student/universities', label: t('navExplore'), icon: 'GraduationCap' },
      { to: '/student/profile', label: t('navProfile'), icon: 'User' },
      { to: '/student/chat', label: t('navChat'), icon: 'MessageCircle' },
    ],
    [t]
  )
  useEffect(() => {
    setNavItems([...navItems, ...navBottomItems])
    return () => setNavItems(null)
  }, [navItems, navBottomItems, setNavItems])

  return (
    <div className="flex">
      <Sidebar items={navItems} bottomItems={navBottomItems} />
      <div className={cn(
        'flex-1 min-w-0 transition-[margin-left] duration-200 pb-20 md:pb-0 bg-pattern-subtle min-h-screen',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
      )}>
        <div className="max-w-content mx-auto w-full px-2 sm:px-4 animate-page-enter">
          <Outlet />
        </div>
      </div>
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
