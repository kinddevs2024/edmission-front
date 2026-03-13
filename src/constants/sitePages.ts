/** Site pages searchable in global search. Terms matched case-insensitive. */
export interface SitePageItem {
  path: string
  /** i18n key for label, e.g. 'common:chat' */
  labelKey: string
  /** Search terms in multiple languages */
  terms: string[]
}

export const SITE_PAGES: SitePageItem[] = [
  { path: '/student/dashboard', labelKey: 'student:navHome', terms: ['dashboard', 'home', 'главная', 'boshqaruv'] },
  { path: '/student/profile', labelKey: 'student:navProfile', terms: ['profile', 'профиль', 'profil'] },
  { path: '/student/universities', labelKey: 'student:exploreUniversities', terms: ['universities', 'explore', 'университеты', 'universitetlar'] },
  { path: '/student/applications', labelKey: 'student:myApplications', terms: ['applications', 'заявки', 'applicatsiyalar'] },
  { path: '/student/offers', labelKey: 'student:allOffers', terms: ['offers', 'офферы', 'takliflar'] },
  { path: '/student/chat', labelKey: 'common:chat', terms: ['chat', 'чат', 'suhbat'] },
  { path: '/student/documents', labelKey: 'student:navDocuments', terms: ['documents', 'документы', 'hujjatlar'] },
  { path: '/student/compare', labelKey: 'student:compareTitle', terms: ['compare', 'сравнить', 'taqqoslash'] },
  { path: '/student/schools', labelKey: 'student:linkToMySchool', terms: ['school', 'schools', 'школа', 'maktab'] },
  { path: '/student/ai', labelKey: 'common:edmissionAi', terms: ['ai', 'assistant', 'помощник', 'yordamchi'] },
  { path: '/university/dashboard', labelKey: 'university:dashboard', terms: ['dashboard', 'home', 'главная', 'boshqaruv'] },
  { path: '/university/profile', labelKey: 'university:navProfile', terms: ['profile', 'профиль', 'profil'] },
  { path: '/university/students', labelKey: 'university:navDiscovery', terms: ['discovery', 'students', 'студенты', 'talabalar'] },
  { path: '/university/pipeline', labelKey: 'university:navPipeline', terms: ['pipeline', 'пайплайн', 'pipeline'] },
  { path: '/university/scholarships', labelKey: 'university:navScholarships', terms: ['scholarships', 'стипендии', 'stipendiyalar'] },
  { path: '/university/faculties', labelKey: 'university:navFaculties', terms: ['faculties', 'факультеты', 'fakultetlar'] },
  { path: '/university/analytics', labelKey: 'university:navAnalytics', terms: ['analytics', 'аналитика', 'tahlil'] },
  { path: '/university/chat', labelKey: 'common:chat', terms: ['chat', 'чат', 'suhbat'] },
  { path: '/university/ai', labelKey: 'common:edmissionAi', terms: ['ai', 'assistant', 'помощник', 'yordamchi'] },
  { path: '/notifications', labelKey: 'common:notifications', terms: ['notifications', 'уведомления', 'bildirishnomalar'] },
  { path: '/profile', labelKey: 'common:profile', terms: ['profile', 'профиль', 'profil'] },
  { path: '/ai', labelKey: 'common:edmissionAi', terms: ['ai', 'assistant', 'помощник', 'yordamchi'] },
  { path: '/support', labelKey: 'common:support', terms: ['support', 'поддержка', 'qollab-quvvatlash', 'yordam'] },
]

function canAccess(path: string, role: string): boolean {
  if (path.startsWith('/student/') && role !== 'student') return false
  if (path.startsWith('/university/') && role !== 'university') return false
  if (path.startsWith('/admin/') && role !== 'admin') return false
  if (path.startsWith('/school/') && role !== 'school_counsellor') return false
  return true
}

export function searchSitePages(query: string, role: string): Array<{ path: string; labelKey: string }> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return SITE_PAGES.filter((p) => canAccess(p.path, role) && p.terms.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase())))
    .slice(0, 8)
    .map(({ path, labelKey }) => ({ path, labelKey }))
}
