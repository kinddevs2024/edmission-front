import type { StudentProfileData } from '@/services/student'

/** True when the student still needs the post-registration setup wizard. */
export function needsStudentRegistrationOnboarding(profile: StudentProfileData | null | undefined): boolean {
  if (!profile) return true
  const hasName = Boolean(String(profile.firstName ?? '').trim())
  const hasFaculty = Array.isArray(profile.interestedFaculties) && profile.interestedFaculties.length > 0
  const hasHobby = Array.isArray(profile.hobbies) && profile.hobbies.length > 0
  const hasBudget = profile.budgetAmount != null && Number(profile.budgetAmount) >= 0
  return !hasName || !hasFaculty || !hasHobby || !hasBudget
}
