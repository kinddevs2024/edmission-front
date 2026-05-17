/** sessionStorage: delegated university account User id or catalog id for multi-university roles. */
export const ACT_AS_UNIVERSITY_USER_ID_KEY = 'edmission_act_as_university_user_id'

export function getActAsUniversityUserId(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  const v = sessionStorage.getItem(ACT_AS_UNIVERSITY_USER_ID_KEY)
  return v && v.trim() ? v.trim() : null
}

export function setActAsUniversityUserId(universityUserId: string): void {
  sessionStorage.setItem(ACT_AS_UNIVERSITY_USER_ID_KEY, universityUserId)
}

export function clearActAsUniversityUserId(): void {
  sessionStorage.removeItem(ACT_AS_UNIVERSITY_USER_ID_KEY)
}
