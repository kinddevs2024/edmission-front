import type { NavigateFunction } from 'react-router-dom'
import type { User } from '@/types/user'
import { loadLanguage } from '@/i18n'
import {
  getFirstSupportedNavigatorLanguage,
  getSavedLanguageIfSupported,
  STORAGE_KEY,
} from '@/i18n/config'

export function needsPasswordSetup(user: Pick<User, 'mustChangePassword' | 'mustSetLocalPassword'>): boolean {
  return Boolean(user.mustChangePassword || user.mustSetLocalPassword)
}

/** After email/password or OAuth login (login page, no language wizard). */
export function navigateAfterLogin(navigate: NavigateFunction, user: User, opts?: { replace?: boolean }) {
  const rep = opts?.replace ?? false
  if (needsPasswordSetup(user)) {
    navigate('/set-password', { replace: rep })
    return
  }
  if (user.role === 'student') navigate('/student/dashboard', { replace: rep })
  else if (user.role === 'university') {
    const up = user.universityProfile
    if (!up?.id) navigate('/university/select', { replace: rep })
    else navigate(up.verified ? '/university/dashboard' : '/university/pending', { replace: rep })
  } else if (user.role === 'school_counsellor') navigate('/school/dashboard', { replace: rep })
  else navigate('/admin', { replace: rep })
}

/** After registration (OAuth or code): optional browser language + dashboard. */
export async function navigateAfterRegistration(
  navigate: NavigateFunction,
  user: User,
  i18n: { changeLanguage: (lng: string) => void },
  opts?: { replace?: boolean }
) {
  const rep = opts?.replace ?? false
  if (needsPasswordSetup(user)) {
    navigate('/set-password', { replace: rep })
    return
  }
  const nextUrl = user.role === 'student' ? '/student/dashboard' : '/university/select'
  const saved = getSavedLanguageIfSupported()
  const inferred = getFirstSupportedNavigatorLanguage()
  const lng = saved ?? inferred
  if (lng) {
    await loadLanguage(lng)
    i18n.changeLanguage(lng)
    try {
      localStorage.setItem(STORAGE_KEY, lng)
    } catch {
      /* ignore */
    }
    navigate(nextUrl, { replace: rep })
    return
  }
  navigate(`/choose-language?next=${encodeURIComponent(nextUrl)}`, { replace: rep })
}
