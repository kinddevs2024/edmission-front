import type { StudentProfileData } from '@/services/student'

export type AcademicCertificateFieldId =
  | 'name'
  | 'location'
  | 'school'
  | 'graduationYear'
  | 'gpa'
  | 'degree'
  | 'language'
  | 'academicFocus'
  | 'destinations'

const hasText = (value: unknown) => value != null && String(value).trim() !== ''

export function getAcademicCertificateCompletion(profile: StudentProfileData | null): number {
  if (!profile) return 0
  const checks = [
    hasText(profile.firstName) && hasText(profile.lastName),
    hasText(profile.country) && hasText(profile.city),
    hasText(profile.schoolName) || profile.schoolsAttended?.some((school) => hasText(school.institutionName)),
    profile.graduationYear != null,
    profile.gpa != null || profile.schoolsAttended?.some((school) => school.gradeAverage != null),
    hasText(profile.targetDegreeLevel),
    hasText(profile.languageLevel) || Boolean(profile.languages?.length),
    Boolean(profile.interestedFaculties?.length || profile.interests?.length),
    Boolean(profile.preferredCountries?.length),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
export function getPrimarySchool(profile: StudentProfileData | null): string {
  if (!profile) return ''
  return profile.schoolName?.trim() || profile.schoolsAttended?.find((school) => hasText(school.institutionName))?.institutionName?.trim() || ''
}

export function getPrimaryGrade(profile: StudentProfileData | null): string {
  if (!profile) return ''
  if (profile.gpa != null) return String(profile.gpa)
  const grade = profile.schoolsAttended?.find((school) => school.gradeAverage != null)?.gradeAverage
  return grade != null ? String(grade) : ''
}

export function getPrimaryLanguage(profile: StudentProfileData | null): string {
  if (!profile) return ''
  if (profile.languageLevel?.trim()) return profile.languageLevel.trim()
  const first = profile.languages?.[0]
  return first ? `${first.language} · ${first.level}` : ''
}

export function getAcademicFocus(profile: StudentProfileData | null): string {
  if (!profile) return ''
  const items = profile.interestedFaculties?.length ? profile.interestedFaculties : profile.interests
  return items?.slice(0, 2).join(' · ') ?? ''
}
