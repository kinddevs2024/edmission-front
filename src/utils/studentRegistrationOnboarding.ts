import type { StudentProfileData } from '@/services/student'

/** True when the student still needs the post-registration setup wizard (name required; other steps skippable). */
export function needsStudentRegistrationOnboarding(profile: StudentProfileData | null | undefined): boolean {
  if (!profile) return true
  return !String(profile.firstName ?? '').trim()
}
