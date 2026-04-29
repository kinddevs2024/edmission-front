type StudentDisplayShape = {
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  email?: string | null
  userEmail?: string | null
  /** University-facing pages show only the student's first name, not last name/contact data. */
  profileVisibility?: 'private' | 'public' | string | null
}

export function getStudentContactEmail(student: StudentDisplayShape | null | undefined): string | undefined {
  if (student?.profileVisibility === 'private') return undefined

  const directEmail = typeof student?.email === 'string' ? student.email.trim() : ''
  if (directEmail) return directEmail

  const userEmail = typeof student?.userEmail === 'string' ? student.userEmail.trim() : ''
  return userEmail || undefined
}

export function getStudentDisplayName(student: StudentDisplayShape | null | undefined, fallback = 'Student'): string {
  if (!student) return fallback
  const firstName = typeof student.firstName === 'string' ? student.firstName.trim() : ''
  if (firstName) return firstName

  if (student.profileVisibility === 'private') {
    return fallback
  }

  const accountName = typeof student.name === 'string' ? student.name.trim() : ''
  if (accountName) return accountName

  return getStudentContactEmail(student) ?? fallback
}
