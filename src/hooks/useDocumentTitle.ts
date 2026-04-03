import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

/** Pathname patterns mapped to translation keys (namespace:key) or fallback text. */
const PATH_TITLES: Record<string, string> = {
  '/': 'common:appName',
  '/login': 'auth:login',
  '/sing-in': 'auth:login',
  '/register': 'auth:register',
  '/forgot-password': 'auth:forgotPassword',
  '/verify-email': 'auth:verifyEmail',
  '/reset-password': 'auth:resetPassword',
  '/set-password': 'auth:setPassword',
  '/choose-language': 'auth:chooseLanguage',
  '/privacy': 'common:privacy',
  '/cookies': 'cookies:title',
  '/profile': 'common:account',
  '/notifications': 'common:notifications',
  '/ai': 'common:edmissionAi',
  '/payment': 'common:subscription',
  '/payment/success': 'common:paymentSuccess',
  '/payment/cancel': 'common:paymentCancel',
  '/support': 'common:support',
  '/student/dashboard': 'student:dashboard',
  '/student/profile': 'student:navProfile',
  '/student/universities': 'student:navUniversities',
  '/student/applications': 'student:navApplications',
  '/student/documents': 'common:documents',
  '/student/schools': 'admin:linkToSchool',
  '/student/offers': 'common:myOffers',
  '/student/compare': 'student:compareTitle',
  '/student/chat': 'student:navChat',
  '/university/select': 'university:selectUniversity',
  '/university/pending': 'university:status',
  '/university/onboarding': 'university:onboarding',
  '/university/profile': 'university:navProfile',
  '/university/dashboard': 'university:dashboard',
  '/university/students': 'university:navDiscovery',
  '/university/pipeline': 'university:navPipeline',
  '/university/scholarships': 'university:navScholarships',
  '/university/faculties': 'university:facultiesListTitle',
  '/university/analytics': 'university:navAnalytics',
  '/university/chat': 'university:navChat',
  '/admin/dashboard': 'admin:dashboard',
  '/admin/users': 'admin:users',
  '/admin/verification': 'admin:verification',
  '/admin/universities': 'admin:universityCatalog',
  '/admin/university-requests': 'admin:universityRequests',
  '/admin/investors': 'admin:investors',
  '/admin/documents': 'admin:studentDocuments',
  '/admin/offers': 'admin:offers',
  '/admin/interests': 'admin:interests',
  '/admin/chats': 'admin:chats',
  '/admin/scholarships': 'admin:scholarships',
  '/admin/support': 'admin:support',
  '/admin/logs': 'admin:logs',
  '/admin/health': 'admin:systemHealth',
  '/admin/ai': 'common:edmissionAi',
  '/school/dashboard': 'school:dashboard',
  '/school/my-school': 'school:mySchool',
  '/school/my-students': 'school:myStudents',
  '/school/join-requests': 'school:joinRequests',
}

export function useDocumentTitle() {
  const { pathname } = useLocation()
  const { t } = useTranslation(['common', 'student', 'university', 'admin', 'school', 'auth', 'cookies'])

  useEffect(() => {
    const base = pathname.replace(/\/$/, '') || '/'
    const key = PATH_TITLES[base]
    let pageTitle: string
    if (key) {
      pageTitle = key.includes(':') ? t(key, { defaultValue: key.split(':')[1] }) : key
    } else if (pathname.startsWith('/university/students/')) {
      pageTitle = t('admin:studentProfile', 'Student')
    } else if (pathname.startsWith('/support/') || pathname.startsWith('/admin/support/')) {
      pageTitle = t('common:support', 'Support')
    } else if (pathname.startsWith('/student/universities/')) {
      pageTitle = t('admin:universityProfile', 'University')
    } else {
      const last = base.split('/').filter(Boolean).pop()
      pageTitle = last ? last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ') : t('common:appName')
    }
    const appName = t('common:appName', 'Edmission')
    document.title = pathname === '/' || pathname === '' ? appName : `${appName} | ${pageTitle}`
  }, [pathname, t, i18n.language])
}
