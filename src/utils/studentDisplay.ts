type StudentDisplayShape = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  userEmail?: string | null
}

export function getStudentContactEmail(student: StudentDisplayShape | null | undefined): string | undefined {
  const directEmail = typeof student?.email === 'string' ? student.email.trim() : ''
  if (directEmail) return directEmail

  const userEmail = typeof student?.userEmail === 'string' ? student.userEmail.trim() : ''
  return userEmail || undefined
}

export function getStudentDisplayName(student: StudentDisplayShape | null | undefined, fallback = 'Student'): string {
  if (!student) return fallback

  const fullName = [student.firstName, student.lastName]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .join(' ')

  if (fullName) return fullName

  return getStudentContactEmail(student) ?? fallback
}
