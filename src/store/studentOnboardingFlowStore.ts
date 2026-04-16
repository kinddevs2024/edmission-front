import { create } from 'zustand'
import { MACRO_ONBOARDING_STORAGE_KEY } from '@/constants/studentOnboarding'

function readMacroDone(): boolean {
  try {
    return localStorage.getItem(MACRO_ONBOARDING_STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

/** Gates driver.js tour until macro onboarding is finished or skipped (student only). */
interface State {
  macroOnboardingDone: boolean
  setMacroOnboardingDone: () => void
  resetMacroOnboardingGate: () => void
}

export const useStudentOnboardingFlowStore = create<State>((set) => ({
  macroOnboardingDone: readMacroDone(),
  setMacroOnboardingDone: () => set({ macroOnboardingDone: true }),
  resetMacroOnboardingGate: () => set({ macroOnboardingDone: false }),
}))
