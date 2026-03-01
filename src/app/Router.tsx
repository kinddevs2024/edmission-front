import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/user'

import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { UniversityLayout } from '@/layouts/UniversityLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { VerifyEmail } from '@/pages/auth/VerifyEmail'
import { ResetPassword } from '@/pages/auth/ResetPassword'

import { StudentDashboard } from '@/pages/student/StudentDashboard'
import { StudentProfilePage } from '@/pages/student/StudentProfilePage'
import { ExploreUniversities } from '@/pages/student/ExploreUniversities'
import { UniversityDetail } from '@/pages/student/UniversityDetail'
import { StudentApplications } from '@/pages/student/StudentApplications'
import { StudentDocuments } from '@/pages/student/StudentDocuments'
import { StudentOffers } from '@/pages/student/StudentOffers'
import { Compare } from '@/pages/student/Compare'
import { StudentChat } from '@/pages/student/StudentChat'

import { UniversityDashboard } from '@/pages/university/UniversityDashboard'
import { UniversityProfilePage } from '@/pages/university/UniversityProfilePage'
import { UniversityOnboarding } from '@/pages/university/UniversityOnboarding'
import { Discovery } from '@/pages/university/Discovery'
import { UniversityStudentProfile } from '@/pages/university/UniversityStudentProfile'
import { Pipeline } from '@/pages/university/Pipeline'
import { Scholarships } from '@/pages/university/Scholarships'
import { UniversityAnalytics } from '@/pages/university/UniversityAnalytics'
import { UniversityChat } from '@/pages/university/UniversityChat'

import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { UserManagement } from '@/pages/admin/UserManagement'
import { Verification } from '@/pages/admin/Verification'
import { AdminDocuments } from '@/pages/admin/AdminDocuments'
import { AdminScholarships } from '@/pages/admin/AdminScholarships'
import { AdminLogs } from '@/pages/admin/AdminLogs'
import { SystemHealth } from '@/pages/admin/SystemHealth'

import { Profile } from '@/pages/Profile'
import { Landing } from '@/pages/Landing'
import { AIChatPage } from '@/pages/AIChatPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { PaymentPage } from '@/pages/PaymentPage'
import { PaymentSuccess } from '@/pages/PaymentSuccess'
import { PaymentCancel } from '@/pages/PaymentCancel'
import { SupportPage } from '@/pages/SupportPage'
import { Privacy } from '@/pages/Privacy'
import { AdminSupport } from '@/pages/admin/AdminSupport'

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
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <>{children}</>
  const redirect = role === 'student' ? '/student/dashboard' : role === 'university' ? '/university/dashboard' : '/admin'
  return <Navigate to={redirect} replace />
}

export function Router() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
      </Route>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<Landing />} />
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
          <Route path="onboarding" element={<UniversityOnboarding />} />
          <Route path="profile" element={<UniversityProfilePage />} />
          <Route path="dashboard" element={<UniversityDashboard />} />
          <Route path="students/:studentId" element={<UniversityStudentProfile />} />
          <Route path="students" element={<Discovery />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="scholarships" element={<Scholarships />} />
          <Route path="analytics" element={<UniversityAnalytics />} />
          <Route path="chat" element={<UniversityChat />} />
          <Route path="ai" element={<AIChatPage />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="verification" element={<Verification />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="scholarships" element={<AdminScholarships />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="support/:id" element={<AdminSupport />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="health" element={<SystemHealth />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
