import type { NavItem } from '@/components/layout/Sidebar'

export interface StudentNavOptions {
  showMySchools: boolean
}

/** Single source of truth: 5 core destinations (mobile bottom + primary sidebar) + More + footer links. */
export function buildStudentNavigation(
  t: (key: string, defaultValue?: string) => string,
  opts: StudentNavOptions
): {
  bottomNavItems: NavItem[]
  sidebarItems: NavItem[]
  sidebarBottomItems: NavItem[]
  mobileMenuItems: NavItem[]
} {
  const core: NavItem[] = [
    { to: '/student/dashboard', label: t('navHome', 'Home'), icon: 'LayoutDashboard' },
    { to: '/student/universities', label: t('navExplore', 'Explore'), icon: 'GraduationCap' },
    { to: '/student/interests', label: t('navApplications', 'Applications'), icon: 'Heart' },
    { to: '/student/chat', label: t('navChat', 'Chat'), icon: 'MessageCircle' },
    { to: '/student/profile', label: t('navProfile', 'Profile'), icon: 'User' },
  ]

  const more: NavItem[] = [
    { to: '/student/universities/map', label: t('navMap', 'Map'), icon: 'Map' },
    {
      to: '/student/ai',
      label: t('navEdmissionAi', 'Edmission AI'),
      icon: 'Bot',
      section: t('navSectionMore', 'More'),
    },
    { to: '/student/documents', label: t('navDocuments', 'Documents'), icon: 'FileText' },
    { to: '/student/offers', label: t('navOffers', 'Offers'), icon: 'Gift' },
    { to: '/student/compare', label: t('navCompare', 'Compare'), icon: 'GitCompare' },
  ]

  if (opts.showMySchools) {
    more.splice(1, 0, {
      to: '/student/schools',
      label: t('navMySchool', 'My school'),
      icon: 'Building2',
    })
  }

  const notifications: NavItem = {
    to: '/notifications',
    label: t('navNotifications', 'Notifications'),
    icon: 'Bell',
  }

  const sidebarBottomItems: NavItem[] = [
    { to: '/support', label: t('navSupport', 'Support'), icon: 'HelpCircle' },
    { to: '/profile', label: t('navSettings', 'Account & settings'), icon: 'Settings' },
  ]

  const sidebarItems: NavItem[] = [
    ...core.map((item, i) => (i === 0 ? { ...item, section: t('navSectionMain', 'Main') } : item)),
    ...more,
    notifications,
  ]

  const mobileMenuItems: NavItem[] = [...sidebarItems, ...sidebarBottomItems]

  return {
    bottomNavItems: core,
    sidebarItems,
    sidebarBottomItems,
    mobileMenuItems,
  }
}
