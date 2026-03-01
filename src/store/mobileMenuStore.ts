import { create } from 'zustand'
import type { NavItem } from '@/components/layout/Sidebar'

interface MobileMenuState {
  navItems: NavItem[] | null
  setNavItems: (items: NavItem[] | null) => void
}

export const useMobileMenuStore = create<MobileMenuState>((set) => ({
  navItems: null,
  setNavItems: (navItems) => set({ navItems }),
}))
