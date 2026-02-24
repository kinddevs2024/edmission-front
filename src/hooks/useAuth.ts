import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/user'

export function useAuth() {
  const { user, accessToken, isAuthenticated, setAuth, setUser, logout } = useAuthStore()
  const role: Role | null = user?.role ?? null
  return {
    user,
    accessToken,
    isAuthenticated,
    role,
    setAuth,
    setUser,
    logout,
  }
}
