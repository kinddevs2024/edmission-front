import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChooseLanguageBeforeOnboarding } from '@/components/onboarding/ChooseLanguageBeforeOnboarding'
import { getProfile, updateProfile } from '@/services/auth'
import { hasSeenTutorial, markTutorialSeen } from '@/components/onboarding/OnboardingTutorialModal'
import { markMacroOnboardingDone } from '@/components/onboarding/StudentMacroOnboarding'
import { useStudentOnboardingFlowStore } from '@/store/studentOnboardingFlowStore'
import { isStudentAccountEstablished } from '@/utils/studentOnboardingEligibility'
import { applyInferredLanguageFromNavigatorIfNeeded } from '@/i18n/languageResolution'
import { needsExplicitLanguageChoice } from '@/i18n/config'
import { toastApiError } from '@/utils/toastError'
import { useAuth } from '@/hooks/useAuth'
import {
  disposeRoleOnboardingTour,
  isRoleOnboardingTourActive,
  startRoleOnboardingTour,
  syncRoleOnboardingTour,
  type OnboardingRole,
  type TourT,
} from '@/components/onboarding/roleOnboardingTour'
const DASHBOARD_PATHS: Record<OnboardingRole, string> = {
  student: '/student/dashboard',
  university: '/university/dashboard',
}

export function RoleOnboardingController({ role }: { role: OnboardingRole }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation(['common', role])
  const { user } = useAuth()
  const macroOnboardingDone = useStudentOnboardingFlowStore((s) => s.macroOnboardingDone)
  const [showLanguageChoice, setShowLanguageChoice] = useState(false)
  const [tourReady, setTourReady] = useState(false)
  const checkingRef = useRef(false)
  const dashboardPath = DASHBOARD_PATHS[role]

  const handleComplete = useCallback(() => {
    updateProfile({
      onboardingTutorialSeen: role === 'student' ? { student: true } : { university: true },
    }).catch(toastApiError)
    markTutorialSeen(role)
    setTourReady(false)
    setShowLanguageChoice(false)
  }, [role])

  useEffect(() => {
    if (user?.role !== role) return
    if (role === 'student' && !macroOnboardingDone) return
    if (location.pathname !== dashboardPath) return
    if (tourReady || showLanguageChoice || isRoleOnboardingTourActive(role) || checkingRef.current) return
    if (hasSeenTutorial(role, user)) return

    let cancelled = false
    checkingRef.current = true

    getProfile()
      .then(async (freshUser) => {
        if (cancelled || hasSeenTutorial(role, freshUser)) return
        if (role === 'student') {
          try {
            const established = await isStudentAccountEstablished()
            if (established) {
              updateProfile({ onboardingTutorialSeen: { student: true } }).catch(toastApiError)
              markTutorialSeen('student')
              markMacroOnboardingDone()
              useStudentOnboardingFlowStore.getState().setMacroOnboardingDone()
              return
            }
          } catch {
            /* fall through to language / tour */
          }
        }
        await applyInferredLanguageFromNavigatorIfNeeded()
        if (needsExplicitLanguageChoice()) {
          setShowLanguageChoice(true)
        } else {
          setTourReady(true)
        }
      })
      .catch(async () => {
        if (cancelled || hasSeenTutorial(role, user)) return
        if (role === 'student') {
          try {
            const established = await isStudentAccountEstablished()
            if (established) {
              updateProfile({ onboardingTutorialSeen: { student: true } }).catch(toastApiError)
              markTutorialSeen('student')
              markMacroOnboardingDone()
              useStudentOnboardingFlowStore.getState().setMacroOnboardingDone()
              return
            }
          } catch {
            /* fall through */
          }
        }
        await applyInferredLanguageFromNavigatorIfNeeded()
        if (needsExplicitLanguageChoice()) {
          setShowLanguageChoice(true)
        } else {
          setTourReady(true)
        }
      })
      .finally(() => {
        checkingRef.current = false
      })

    return () => {
      cancelled = true
    }
  }, [dashboardPath, location.pathname, macroOnboardingDone, role, showLanguageChoice, tourReady, user])

  useEffect(() => {
    if (!tourReady || location.pathname !== dashboardPath || isRoleOnboardingTourActive(role)) return

    const tWithNs: TourT = (key: string, fallback?: string) => {
      if (key.startsWith('common:')) return t(key.slice(7), { ns: 'common', defaultValue: fallback ?? key })
      return t(key, { ns: role, defaultValue: fallback ?? key })
    }

    startRoleOnboardingTour({
      role,
      pathname: location.pathname,
      navigate,
      t: tWithNs,
      onComplete: handleComplete,
    })
  }, [dashboardPath, handleComplete, location.pathname, navigate, role, t, tourReady])

  useEffect(() => {
    syncRoleOnboardingTour(role, location.pathname)
  }, [location.pathname, role])

  useEffect(() => {
    return () => {
      disposeRoleOnboardingTour(role)
    }
  }, [role])

  return (
    <ChooseLanguageBeforeOnboarding
      open={showLanguageChoice}
      onLanguageSelected={() => {
        setShowLanguageChoice(false)
        setTourReady(true)
      }}
    />
  )
}
