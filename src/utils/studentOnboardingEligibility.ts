import { getApplications, getStudentProfile } from '@/services/student'

/**
 * Accounts that already have a complete minimal profile and at least one university interest
 * should not see first-run onboarding (macro modal + driver tour), even if localStorage was cleared
 * or server flags were never set.
 */
export async function isStudentAccountEstablished(): Promise<boolean> {
  try {
    const [profile, appsRes] = await Promise.all([
      getStudentProfile(),
      getApplications({ limit: 1 }),
    ])
    const minimal = profile.minimalPortfolioComplete === true
    const hasInterest = (appsRes.data?.length ?? 0) > 0
    return minimal && hasInterest
  } catch {
    return false
  }
}

/**
 * True only for accounts that have never started the profile (0%), no minimal completion, no interests.
 * If the user already has any portfolio % (e.g. 13%), they must not see "Welcome to Edmission" again.
 */
export async function shouldShowWelcomeMacroOnboarding(): Promise<boolean> {
  try {
    const [profile, appsRes] = await Promise.all([
      getStudentProfile(),
      getApplications({ limit: 1 }),
    ])
    const pct =
      typeof profile.portfolioCompletionPercent === 'number' ? profile.portfolioCompletionPercent : 0
    if (pct > 0) return false
    if (profile.minimalPortfolioComplete === true) return false
    if ((appsRes.data?.length ?? 0) > 0) return false
    return true
  } catch {
    return false
  }
}
