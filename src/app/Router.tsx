import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/user'

import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { UniversityLayout } from '@/layouts/UniversityLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.Register })))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail').then((m) => ({ default: m.VerifyEmail })))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })))

const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })))
const StudentProfilePage = lazy(() => import('@/pages/student/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })))
const ExploreUniversities = lazy(() => import('@/pages/student/ExploreUniversities').then((m) => ({ default: m.ExploreUniversities })))
const UniversityDetail = lazy(() => import('@/pages/student/UniversityDetail').then((m) => ({ default: m.UniversityDetail })))
const StudentApplications = lazy(() => import('@/pages/student/StudentApplications').then((m) => ({ default: m.StudentApplications })))
const StudentDocuments = lazy(() => import('@/pages/student/StudentDocuments').then((m) => ({ default: m.StudentDocuments })))
const StudentOffers = lazy(() => import('@/pages/student/StudentOffers').then((m) => ({ default: m.StudentOffers })))
const Compare = lazy(() => import('@/pages/student/Compare').then((m) => ({ default: m.Compare })))
const StudentChat = lazy(() => import('@/pages/student/StudentChat').then((m) => ({ default: m.StudentChat })))

const UniversityDashboard = lazy(() => import('@/pages/university/UniversityDashboard').then((m) => ({ default: m.UniversityDashboard })))
const UniversityProfilePage = lazy(() => import('@/pages/university/UniversityProfilePage').then((m) => ({ default: m.UniversityProfilePage })))
const UniversityOnboarding = lazy(() => import('@/pages/university/UniversityOnboarding').then((m) => ({ default: m.UniversityOnboarding })))
const Discovery = lazy(() => import('@/pages/university/Discovery').then((m) => ({ default: m.Discovery })))
const UniversityStudentProfile = lazy(() => import('@/pages/university/UniversityStudentProfile').then((m) => ({ default: m.UniversityStudentProfile })))
const Pipeline = lazy(() => import('@/pages/university/Pipeline').then((m) => ({ default: m.Pipeline })))
const Scholarships = lazy(() => import('@/pages/university/Scholarships').then((m) => ({ default: m.Scholarships })))
const Faculties = lazy(() => import('@/pages/university/Faculties').then((m) => ({ default: m.Faculties })))
const UniversityAnalytics = lazy(() => import('@/pages/university/UniversityAnalytics').then((m) => ({ default: m.UniversityAnalytics })))
const UniversityChat = lazy(() => import('@/pages/university/UniversityChat').then((m) => ({ default: m.UniversityChat })))
const UniversityPendingVerification = lazy(() => import('@/pages/university/UniversityPendingVerification').then((m) => ({ default: m.UniversityPendingVerification })))
const UniversitySelect = lazy(() => import('@/pages/university/UniversitySelect').then((m) => ({ default: m.UniversitySelect })))

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const UserManagement = lazy(() => import('@/pages/admin/UserManagement').then((m) => ({ default: m.UserManagement })))
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
const AdminInvestors = lazy(() => import('@/pages/admin/AdminInvestors').then((m) => ({ default: m.AdminInvestors })))
const AdminUniversityRequests = lazy(() => import('@/pages/admin/AdminUniversityRequests').then((m) => ({ default: m.AdminUniversityRequests })))

const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })))
const AIChatPage = lazy(() => import('@/pages/AIChatPage').then((m) => ({ default: m.AIChatPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const PaymentPage = lazy(() => import('@/pages/PaymentPage').then((m) => ({ default: m.PaymentPage })))
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess').then((m) => ({ default: m.PaymentSuccess })))
const PaymentCancel = lazy(() => import('@/pages/PaymentCancel').then((m) => ({ default: m.PaymentCancel })))
const SupportPage = lazy(() => import('@/pages/SupportPage').then((m) => ({ default: m.SupportPage })))
const Privacy = lazy(() => import('@/pages/Privacy').then((m) => ({ default: m.Privacy })))

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center" aria-hidden>
      <div className="w-8 h-8 border-2 border-[var(--color-primary-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: Role[] }) {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && !allowedRoles.includes(role)) {
    const redirect = role === 'student' ? '/student/dashboard' : role === 'university' ? '/university/dashboard' : '/admin'
    return <Navigate to={redirect} replace />
  }
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, user } = useAuth()
  if (!isAuthenticated) return <>{children}</>
  let redirect: string
  if (role === 'student') redirect = '/student/dashboard'
  else if (role === 'university') {
    if (!user?.universityProfile) redirect = '/university/select'
    else redirect = user.universityProfile.verified ? '/university/dashboard' : '/university/pending'
  } else redirect = '/admin'
  return <Navigate to={redirect} replace />
}

function LandingOrRedirect() {
  const { isAuthenticated, role, user } = useAuth()
  if (!isAuthenticated) return <Landing /> 
  let to: string
  if (role === 'student') to = '/student/dashboard'
  else if (role === 'university') {
    if (!user?.universityProfile) to = '/university/select'
    else to = user.universityProfile.verified ? '/university/dashboard' : '/university/pending'
  } else to = '/admin'
  return <Navigate to={to} replace />
}

export function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
      </Route>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingOrRedirect />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="profile" element={<ProtectedRoute allowedRoles={['student', 'university', 'admin']}><Profile /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute allowedRoles={['student', 'university']}><NotificationsPage /></ProtectedRoute>} />
        <Route path="ai" element={<ProtectedRoute allowedRoles={['student', 'university']}><AIChatPage /></ProtectedRoute>} />
        <Route path="payment" element={<ProtectedRoute allowedRoles={['student', 'university']}><PaymentPage /></ProtectedRoute>} />
        <Route path="payment/success" element={<ProtectedRoute allowedRoles={['student', 'university']}><PaymentSuccess /></ProtectedRoute>} />
        <Route path="payment/cancel" element={<ProtectedRoute allowedRoles={['student', 'university']}><PaymentCancel /></ProtectedRoute>} />
        <Route path="support" element={<ProtectedRoute allowedRoles={['student', 'university']}><SupportPage /></ProtectedRoute>} />
        <Route path="support/:id" element={<ProtectedRoute allowedRoles={['student', 'university']}><SupportPage /></ProtectedRoute>} />

        <Route path="student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="universities" element={<ExploreUniversities />} />
          <Route path="universities/:id" element={<UniversityDetail />} />
          <Route path="applications" element={<StudentApplications />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="offers" element={<StudentOffers />} />
          <Route path="compare" element={<Compare />} />
          <Route path="chat" element={<StudentChat />} />
          <Route path="ai" element={<AIChatPage />} />
        </Route>

        <Route path="university" element={<ProtectedRoute allowedRoles={['university']}><UniversityLayout /></ProtectedRoute>}>
          <Route path="select" element={<UniversitySelect />} />
          <Route path="pending" element={<UniversityPendingVerification />} />
          <Route path="onboarding" element={<UniversityOnboarding />} />
          <Route path="profile" element={<UniversityProfilePage />} />
          <Route path="dashboard" element={<UniversityDashboard />} />
          <Route path="students/:studentId" element={<UniversityStudentProfile />} />
          <Route path="students" element={<Discovery />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="scholarships" element={<Scholarships />} />
          <Route path="faculties" element={<Faculties />} />
          <Route path="analytics" element={<UniversityAnalytics />} />
          <Route path="chat" element={<UniversityChat />} />
          <Route path="ai" element={<AIChatPage />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="verification" element={<Verification />} />
          <Route path="universities" element={<AdminUniversities />} />
          <Route path="university-requests" element={<AdminUniversityRequests />} />
          <Route path="investors" element={<AdminInvestors />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="interests" element={<AdminInterests />} />
          <Route path="chats" element={<AdminChats />} />
          <Route path="scholarships" element={<AdminScholarships />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="support/:id" element={<AdminSupport />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="health" element={<SystemHealth />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
