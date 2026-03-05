import { create } from 'zustand'
import type { User } from '@/types/user'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  logout: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}))
