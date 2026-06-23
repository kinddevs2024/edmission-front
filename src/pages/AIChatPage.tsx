import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { isUniversityLikeRole } from '@/types/user'

export function AIChatPage() {
  const { role } = useAuth()

  if (role === 'student') return <Navigate to="/student/chat" replace />
  if (isUniversityLikeRole(role)) return <Navigate to="/university/chat" replace />
  if (role === 'admin') return <Navigate to="/admin/consulting" replace />
  if (role === 'school_counsellor') return <Navigate to="/school/chats" replace />

  return <Navigate to="/support" replace />
}
