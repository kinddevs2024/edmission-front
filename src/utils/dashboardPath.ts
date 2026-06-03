import type { User } from '@/types/user'

export function getDashboardPath(user?: Pick<User, 'role' | 'universityProfile'> | null): string {
  if (!user?.role) return '/'

  if (user.role === 'student') return '/student/dashboard'
  if (user.role === 'school_counsellor') return '/school/dashboard'
  if (user.role === 'manager' || user.role === 'counsellor_coordinator') return '/admin/dashboard'
  if (user.role === 'admin' || user.role === 'student_admin') return '/admin/dashboard'
  if (user.role === 'university') {
    if (!user.universityProfile) return '/university/select'
    return user.universityProfile.verified ? '/university/dashboard' : '/university/pending'
  }
  if (user.role === 'university_multi_manager' || user.role === 'multi_university_admin') return '/university-multi-manager'

  return '/'
}
