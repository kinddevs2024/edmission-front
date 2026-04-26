import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Role } from '@/types/user'

import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { UniversityLayout } from '@/layouts/UniversityLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { SchoolLayout } from '@/layouts/SchoolLayout'
import { SiteVisitTracker } from '@/components/analytics/SiteVisitTracker'

const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.Register })))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail').then((m) => ({ default: m.VerifyEmail })))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })))
const SetPassword = lazy(() => import('@/pages/auth/SetPassword').then((m) => ({ default: m.SetPassword })))
const ChooseLanguage = lazy(() => import('@/pages/auth/ChooseLanguage').then((m) => ({ default: m.ChooseLanguage })))
const YandexCallback = lazy(() => import('@/pages/auth/YandexCallback').then((m) => ({ default: m.YandexCallback })))
const GoogleMobileCallback = lazy(() => import('@/pages/auth/GoogleMobileCallback').then((m) => ({ default: m.GoogleMobileCallback })))
const TelegramAuth = lazy(() => import('@/pages/auth/TelegramAuth').then((m) => ({ default: m.TelegramAuth })))

const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })))
const StudentProfilePage = lazy(() => import('@/pages/student/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })))
const ExploreUniversities = lazy(() => import('@/pages/student/ExploreUniversities').then((m) => ({ default: m.ExploreUniversities })))
const UniversitiesMap = lazy(() => import('@/pages/student/UniversitiesMap').then((m) => ({ default: m.UniversitiesMap })))
const StudentExploreMore = lazy(() => import('@/pages/student/StudentExploreMore').then((m) => ({ default: m.StudentExploreMore })))
const UniversityDetail = lazy(() => import('@/pages/student/UniversityDetail').then((m) => ({ default: m.UniversityDetail })))
const StudentApplications = lazy(() => import('@/pages/student/StudentApplications').then((m) => ({ default: m.StudentApplications })))
const StudentDocuments = lazy(() => import('@/pages/student/StudentDocuments').then((m) => ({ default: m.StudentDocuments })))
const StudentOffers = lazy(() => import('@/pages/student/StudentOffers').then((m) => ({ default: m.StudentOffers })))
const StudentReceivedDocument = lazy(() => import('@/pages/student/StudentReceivedDocument').then((m) => ({ default: m.StudentReceivedDocument })))
const Compare = lazy(() => import('@/pages/student/Compare').then((m) => ({ default: m.Compare })))
const StudentChat = lazy(() => import('@/pages/student/StudentChat').then((m) => ({ default: m.StudentChat })))
const StudentSchools = lazy(() => import('@/pages/student/StudentSchools').then((m) => ({ default: m.StudentSchools })))

const UniversityDashboard = lazy(() => import('@/pages/university/UniversityDashboard').then((m) => ({ default: m.UniversityDashboard })))
const UniversityProfilePage = lazy(() => import('@/pages/university/UniversityProfilePage').then((m) => ({ default: m.UniversityProfilePage })))
const UniversityOnboarding = lazy(() => import('@/pages/university/UniversityOnboarding').then((m) => ({ default: m.UniversityOnboarding })))
const Discovery = lazy(() => import('@/pages/university/Discovery').then((m) => ({ default: m.Discovery })))
const StudentsMap = lazy(() => import('@/pages/university/StudentsMap').then((m) => ({ default: m.StudentsMap })))
const UniversityStudentProfile = lazy(() => import('@/pages/university/UniversityStudentProfile').then((m) => ({ default: m.UniversityStudentProfile })))
const Pipeline = lazy(() => import('@/pages/university/Pipeline').then((m) => ({ default: m.Pipeline })))
const Scholarships = lazy(() => import('@/pages/university/Scholarships').then((m) => ({ default: m.Scholarships })))
const Faculties = lazy(() => import('@/pages/university/Faculties').then((m) => ({ default: m.Faculties })))
const UniversityAnalytics = lazy(() => import('@/pages/university/UniversityAnalytics').then((m) => ({ default: m.UniversityAnalytics })))
const UniversityChat = lazy(() => import('@/pages/university/UniversityChat').then((m) => ({ default: m.UniversityChat })))
const UniversityPendingVerification = lazy(() => import('@/pages/university/UniversityPendingVerification').then((m) => ({ default: m.UniversityPendingVerification })))
const UniversitySelect = lazy(() => import('@/pages/university/UniversitySelect').then((m) => ({ default: m.UniversitySelect })))
const OfferTemplates = lazy(() => import('@/pages/university/OfferTemplates').then((m) => ({ default: m.OfferTemplates })))
const UniversityDocuments = lazy(() => import('@/pages/university/UniversityDocuments').then((m) => ({ default: m.UniversityDocuments })))
const UniversityMultiManagerHome = lazy(() =>
  import('@/pages/university/UniversityMultiManagerHome').then((m) => ({ default: m.UniversityMultiManagerHome }))
)
const DocumentTemplateEditorPage = lazy(() => import('@/pages/university/DocumentTemplateEditorPage').then((m) => ({ default: m.DocumentTemplateEditorPage })))
const UniversityFlyers = lazy(() => import('@/pages/university/UniversityFlyers').then((m) => ({ default: m.UniversityFlyers })))
const UniversityFlyerEditorPage = lazy(() => import('@/pages/university/UniversityFlyerEditorPage').then((m) => ({ default: m.UniversityFlyerEditorPage })))

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics').then((m) => ({ default: m.AdminAnalytics })))
const UserManagement = lazy(() => import('@/pages/admin/UserManagement').then((m) => ({ default: m.UserManagement })))
const AdminStudentProfile = lazy(() => import('@/pages/admin/AdminStudentProfile').then((m) => ({ default: m.AdminStudentProfile })))
const AdminUniversityProfile = lazy(() => import('@/pages/admin/AdminUniversityProfile').then((m) => ({ default: m.AdminUniversityProfile })))
const AdminCounsellorProfile = lazy(() => import('@/pages/admin/AdminCounsellorProfile').then((m) => ({ default: m.AdminCounsellorProfile })))
const AdminUniversityDocumentsLayout = lazy(() =>
  import('@/pages/admin/AdminUniversityDocumentsLayout').then((m) => ({ default: m.AdminUniversityDocumentsLayout }))
)
const Verification = lazy(() => import('@/pages/admin/Verification').then((m) => ({ default: m.Verification })))
const AdminDocuments = lazy(() => import('@/pages/admin/AdminDocuments').then((m) => ({ default: m.AdminDocuments })))
const AdminScholarships = lazy(() => import('@/pages/admin/AdminScholarships').then((m) => ({ default: m.AdminScholarships })))
const AdminLogs = lazy(() => import('@/pages/admin/AdminLogs').then((m) => ({ default: m.AdminLogs })))
const SystemHealth = lazy(() => import('@/pages/admin/SystemHealth').then((m) => ({ default: m.SystemHealth })))
const AdminOffers = lazy(() => import('@/pages/admin/AdminOffers').then((m) => ({ default: m.AdminOffers })))
const AdminInterests = lazy(() => import('@/pages/admin/AdminInterests').then((m) => ({ default: m.AdminInterests })))
const AdminChats = lazy(() => import('@/pages/admin/AdminChats').then((m) => ({ default: m.AdminChats })))
const AdminSupport = lazy(() => import('@/pages/admin/AdminSupport').then((m) => ({ default: m.AdminSupport })))
const AdminUniversities = lazy(() => import('@/pages/admin/AdminUniversities').then((m) => ({ default: m.AdminUniversities })))
const AdminFaculties = lazy(() => import('@/pages/admin/AdminFaculties').then((m) => ({ default: m.AdminFaculties })))
const AdminInvestors = lazy(() => import('@/pages/admin/AdminInvestors').then((m) => ({ default: m.AdminInvestors })))
const AdminLandingCertificates = lazy(() => import('@/pages/admin/AdminLandingCertificates').then((m) => ({ default: m.AdminLandingCertificates })))
const AdminUniversityRequests = lazy(() => import('@/pages/admin/AdminUniversityRequests').then((m) => ({ default: m.AdminUniversityRequests })))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })))
const CounsellorSchoolProfile = lazy(() => import('@/pages/admin/CounsellorSchoolProfile').then((m) => ({ default: m.CounsellorSchoolProfile })))
const CounsellorStudents = lazy(() => import('@/pages/admin/CounsellorStudents').then((m) => ({ default: m.CounsellorStudents })))
const CounsellorJoinRequests = lazy(() => import('@/pages/admin/CounsellorJoinRequests').then((m) => ({ default: m.CounsellorJoinRequests })))
const CounsellorStudentInterests = lazy(() => import('@/pages/school/CounsellorStudentInterests').then((m) => ({ default: m.CounsellorStudentInterests })))
const CounsellorApplications = lazy(() => import('@/pages/school/CounsellorApplications').then((m) => ({ default: m.CounsellorApplications })))
const CounsellorOffers = lazy(() => import('@/pages/school/CounsellorOffers').then((m) => ({ default: m.CounsellorOffers })))
const SchoolDashboard = lazy(() => import('@/pages/school/SchoolDashboard').then((m) => ({ default: m.SchoolDashboard })))
const CounsellorStudentProfile = lazy(() => import('@/pages/school/CounsellorStudentProfile').then((m) => ({ default: m.CounsellorStudentProfile })))
const CounsellorStudentDocuments = lazy(() => import('@/pages/school/CounsellorStudentDocuments').then((m) => ({ default: m.CounsellorStudentDocuments })))
const CounsellorStudentsMap = lazy(() => import('@/pages/school/CounsellorStudentsMap').then((m) => ({ default: m.CounsellorStudentsMap })))

const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })))
const ExploreCatalogPage = lazy(() => import('@/pages/ExploreCatalogPage').then((m) => ({ default: m.ExploreCatalogPage })))
const AIChatPage = lazy(() => import('@/pages/AIChatPage').then((m) => ({ default: m.AIChatPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const PaymentPage = lazy(() => import('@/pages/PaymentPage').then((m) => ({ default: m.PaymentPage })))
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess').then((m) => ({ default: m.PaymentSuccess })))
const PaymentCancel = lazy(() => import('@/pages/PaymentCancel').then((m) => ({ default: m.PaymentCancel })))
const SupportPage = lazy(() => import('@/pages/SupportPage').then((m) => ({ default: m.SupportPage })))
const Privacy = lazy(() => import('@/pages/Privacy').then((m) => ({ default: m.Privacy })))
const Cookies = lazy(() => import('@/pages/Cookies').then((m) => ({ default: m.Cookies })))
const Maintenance = lazy(() => import('@/pages/Maintenance').then((m) => ({ default: m.Maintenance })))
const HowEdmissionWorks = lazy(() => import('@/pages/HowEdmissionWorks').then((m) => ({ default: m.HowEdmissionWorks })))

function PageFallback() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center" aria-hidden>
      <div className="w-8 h-8 border-2 border-[var(--color-primary-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function isAdminPanelRole(role: Role | null): boolean {
  return role === 'admin' || role === 'manager' || role === 'counsellor_coordinator'
}

function AIPageOrRedirect() {
  const { role } = useAuth()
  if (isAdminPanelRole(role)) return <Navigate to="/admin/ai" replace />
  return <AIChatPage />
}

function needsPasswordGate(user: { mustChangePassword?: boolean; mustSetLocalPassword?: boolean } | null | undefined) {
  return Boolean(user?.mustChangePassword || user?.mustSetLocalPassword)
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: Role[] }) {
  const { isAuthenticated, role, user } = useAuth()
  const location = window.location.pathname
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (needsPasswordGate(user) && !location.startsWith('/set-password')) {
    return <Navigate to="/set-password" replace />
  }
  if (role && !allowedRoles.includes(role)) {
    const redirect = role === 'student'
      ? '/student/dashboard'
      : role === 'university'
        ? '/university/dashboard'
        : role === 'university_multi_manager'
          ? '/university-multi-manager'
          : role === 'school_counsellor'
            ? '/school/dashboard'
            : '/admin'
    return <Navigate to={redirect} replace />
  }
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, user } = useAuth()
  if (!isAuthenticated) return <>{children}</>
  if (needsPasswordGate(user)) return <Navigate to="/set-password" replace />
  let redirect: string
  if (role === 'student') redirect = '/student/dashboard'
  else if (role === 'university') {
    if (!user?.universityProfile) redirect = '/university/select'
    else redirect = user.universityProfile.verified ? '/university/dashboard' : '/university/pending'
  } else if (role === 'university_multi_manager') {
    redirect = '/university-multi-manager'
  } else if (isAdminPanelRole(role)) redirect = '/admin'
  else if (role === 'school_counsellor') redirect = '/school/dashboard'
  else redirect = '/admin'
  return <Navigate to={redirect} replace />
}

function LandingOrRedirect() {
  const { isAuthenticated, role, user } = useAuth()
  if (!isAuthenticated) return <Landing />
  if (needsPasswordGate(user)) return <Navigate to="/set-password" replace />
  let to: string
  if (role === 'student') to = '/student/dashboard'
  else if (role === 'university') {
    if (!user?.universityProfile) to = '/university/select'
    else to = user.universityProfile.verified ? '/university/dashboard' : '/university/pending'
  } else if (role === 'university_multi_manager') {
    to = '/university-multi-manager'
  } else if (isAdminPanelRole(role)) to = '/admin'
  else if (role === 'school_counsellor') to = '/school/dashboard'
  else to = '/admin'
  return <Navigate to={to} replace />
}

function DocumentTitle() {
  useDocumentTitle()
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
    <DocumentTitle />
    <ScrollToTop />
    <SiteVisitTracker />
    <Routes>
      <Route path="/maintenance" element={<Maintenance />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/login-phone" element={<Navigate to="/login" replace />} />
        <Route path="/sing-in" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/register-phone" element={<Navigate to="/register" replace />} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
        <Route path="/set-password" element={<ProtectedRoute allowedRoles={['student', 'university', 'university_multi_manager', 'admin', 'school_counsellor', 'manager', 'counsellor_coordinator']}><SetPassword /></ProtectedRoute>} />
        <Route path="/choose-language" element={<PublicOnlyRoute><ChooseLanguage /></PublicOnlyRoute>} />
        <Route path="/auth/yandex/callback" element={<YandexCallback />} />
        <Route path="/auth/google/mobile" element={<GoogleMobileCallback />} />
        <Route path="/auth/telegram" element={<PublicOnlyRoute><TelegramAuth /></PublicOnlyRoute>} />
      </Route>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingOrRedirect />} />
        <Route path="explore" element={<PublicOnlyRoute><ExploreCatalogPage /></PublicOnlyRoute>} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="cookies" element={<Cookies />} />
        <Route path="how-edmission-works" element={<HowEdmissionWorks />} />
        <Route path="help/tutorials" element={<HowEdmissionWorks />} />
        <Route path="profile" element={<ProtectedRoute allowedRoles={['student', 'university', 'university_multi_manager', 'admin', 'school_counsellor', 'manager', 'counsellor_coordinator']}><Profile /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute allowedRoles={['student', 'university', 'university_multi_manager', 'admin', 'school_counsellor', 'manager', 'counsellor_coordinator']}><NotificationsPage /></ProtectedRoute>} />
        <Route
          path="search"
          element={
            <ProtectedRoute allowedRoles={['student', 'university', 'university_multi_manager', 'admin', 'school_counsellor', 'manager', 'counsellor_coordinator']}>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route path="ai" element={<ProtectedRoute allowedRoles={['student', 'university', 'university_multi_manager', 'admin', 'school_counsellor', 'manager', 'counsellor_coordinator']}><AIPageOrRedirect /></ProtectedRoute>} />
        <Route path="payment" element={<ProtectedRoute allowedRoles={['student', 'university']}><PaymentPage /></ProtectedRoute>} />
        <Route path="payment/success" element={<ProtectedRoute allowedRoles={['student', 'university']}><PaymentSuccess /></ProtectedRoute>} />
        <Route path="payment/cancel" element={<ProtectedRoute allowedRoles={['student', 'university']}><PaymentCancel /></ProtectedRoute>} />
        <Route path="support" element={<ProtectedRoute allowedRoles={['student', 'university', 'school_counsellor']}><SupportPage /></ProtectedRoute>} />
        <Route path="support/:id" element={<ProtectedRoute allowedRoles={['student', 'university', 'school_counsellor']}><SupportPage /></ProtectedRoute>} />

        <Route path="student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="universities" element={<ExploreUniversities />} />
          <Route path="universities/map" element={<UniversitiesMap />} />
          <Route path="explore-more" element={<StudentExploreMore />} />
          <Route path="universities/:id" element={<UniversityDetail />} />
          <Route path="applications" element={<Navigate to="/student/interests" replace />} />
          <Route path="interests" element={<StudentApplications />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="schools" element={<StudentSchools />} />
          <Route path="school-invitations" element={<Navigate to="/student/schools" replace />} />
          <Route path="offers" element={<StudentOffers />} />
          <Route path="received-documents/:id" element={<StudentReceivedDocument />} />
          <Route path="compare" element={<Compare />} />
          <Route path="chat" element={<StudentChat />} />
          <Route path="ai" element={<AIChatPage />} />
        </Route>

        <Route
          path="university-multi-manager"
          element={(
            <ProtectedRoute allowedRoles={['university_multi_manager']}>
              <UniversityMultiManagerHome />
            </ProtectedRoute>
          )}
        />

        <Route path="university" element={<ProtectedRoute allowedRoles={['university', 'university_multi_manager']}><UniversityLayout /></ProtectedRoute>}>
          <Route path="select" element={<UniversitySelect />} />
          <Route path="pending" element={<UniversityPendingVerification />} />
          <Route path="onboarding" element={<UniversityOnboarding />} />
          <Route path="profile" element={<UniversityProfilePage />} />
          <Route path="dashboard" element={<UniversityDashboard />} />
          <Route path="students/map" element={<StudentsMap />} />
          <Route path="students/:studentId" element={<UniversityStudentProfile />} />
          <Route path="students" element={<Discovery />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="scholarships" element={<Scholarships />} />
          <Route path="faculties" element={<Faculties />} />
          <Route path="analytics" element={<UniversityAnalytics />} />
          <Route path="chat" element={<UniversityChat />} />
          <Route path="documents" element={<UniversityDocuments />} />
          <Route path="flyers" element={<UniversityFlyers />} />
          <Route path="flyers/new" element={<UniversityFlyerEditorPage />} />
          <Route path="documents/templates/new" element={<DocumentTemplateEditorPage />} />
          <Route path="documents/templates/:id/edit" element={<DocumentTemplateEditorPage />} />
          <Route path="offer-templates" element={<OfferTemplates />} />
          <Route path="ai" element={<AIChatPage />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'counsellor_coordinator']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/:userId/student-profile" element={<AdminStudentProfile />} />
          <Route path="users/:userId/university-profile" element={<AdminUniversityProfile />} />
          <Route path="users/:userId/counsellor-profile" element={<AdminCounsellorProfile />} />
          <Route path="users/:userId/university-documents" element={<AdminUniversityDocumentsLayout />}>
            <Route index element={<UniversityDocuments />} />
            <Route path="templates/new" element={<DocumentTemplateEditorPage />} />
            <Route path="templates/:id/edit" element={<DocumentTemplateEditorPage />} />
          </Route>
          <Route path="verification" element={<Verification />} />
          <Route path="universities" element={<AdminUniversities />} />
          <Route path="faculties" element={<AdminFaculties />} />
          <Route path="university-requests" element={<AdminUniversityRequests />} />
          <Route path="investors" element={<AdminInvestors />} />
          <Route path="landing-certificates" element={<AdminLandingCertificates />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="interests" element={<AdminInterests />} />
          <Route path="chats" element={<AdminChats />} />
          <Route path="scholarships" element={<AdminScholarships />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="support/:id" element={<AdminSupport />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="health" element={<SystemHealth />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="ai" element={<AIChatPage />} />
        </Route>

        <Route path="school" element={<ProtectedRoute allowedRoles={['school_counsellor']}><SchoolLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SchoolDashboard />} />
          <Route path="my-school" element={<CounsellorSchoolProfile />} />
          <Route path="my-students/map" element={<CounsellorStudentsMap />} />
          <Route path="my-students" element={<CounsellorStudents />} />
          <Route path="student-interests" element={<CounsellorStudentInterests />} />
          <Route path="applications" element={<CounsellorApplications />} />
          <Route path="offers" element={<CounsellorOffers />} />
          <Route path="students/:studentId/profile" element={<CounsellorStudentProfile />} />
          <Route path="students/:studentId/documents" element={<CounsellorStudentDocuments />} />
          <Route path="join-requests" element={<CounsellorJoinRequests />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
