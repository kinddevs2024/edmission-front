import type { User } from '@/types/user'

export function getDashboardPath(user?: Pick<User, 'role' | 'universityProfile'> | null): string {
  if (!user?.role) return '/'

  if (user.role === 'student') return '/student/dashboard'
  if (user.role === 'school_counsellor') return '/school/dashboard'
  if (user.role === 'manager' || user.role === 'counsellor_coordinator') return '/admin/dashboard'
  if (user.role === 'admin') return '/admin/dashboard'
  if (user.role === 'university') {
    if (!user.universityProfile) return '/university/select'
    return user.universityProfile.verified ? '/university/dashboard' : '/university/pending'
  }

  return '/'
}
