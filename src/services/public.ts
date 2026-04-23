import { api } from './api'
import type { PaginatedResponse } from '@/types/api'
import type { UniversityListItem } from '@/types/university'

const VISITOR_ID_STORAGE_KEY = 'edmission_visitor_id'

function createVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server'
  const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY)
  if (existing) return existing
  const next = createVisitorId()
  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, next)
  return next
}

export interface LandingCertificate {
  id: string
  type: 'university' | 'student'
  title: string
  imageUrl: string
  order: number
}

export async function getLandingCertificates(): Promise<LandingCertificate[]> {
  const { data } = await api.get<LandingCertificate[]>('/public/landing-certificates')
  return data ?? []
}

export interface PublicStats {
  universities: number
  students: number
  scholarships: number
}

export interface TrustedUniversityLogo {
  id: string
  name: string
  logoUrl: string
  logo?: string
}

export interface TrustedUniversityLogoPage {
  items: TrustedUniversityLogo[]
  total: number
  limit: number
  offset: number
  nextOffset: number | null
  hasMore: boolean
}

export async function getPublicStats(): Promise<PublicStats> {
  const { data } = await api.get<PublicStats>('/public/stats')
  return data ?? { universities: 0, students: 0, scholarships: 0 }
}

export interface PublicUniversitiesParams {
  page?: number
  limit?: number
}

function normalizePublicUniversityItem(
  item: UniversityListItem & { universityName?: string; logoUrl?: string; foundedYear?: number; establishedYear?: number }
): UniversityListItem {
  return {
    ...item,
    name: item.name ?? item.universityName ?? '',
    logo: item.logo ?? item.logoUrl,
    foundedYear: item.foundedYear ?? item.establishedYear,
  }
}

export async function getPublicUniversities(
  params: PublicUniversitiesParams = {}
): Promise<PaginatedResponse<UniversityListItem>> {
  const query: Record<string, string> = {}
  if (params.page != null) query.page = String(params.page)
  if (params.limit != null) query.limit = String(params.limit)

  const { data } = await api.get<
    PaginatedResponse<UniversityListItem & { universityName?: string; logoUrl?: string; establishedYear?: number }>
  >('/public/universities', { params: query })

  if (!data) return { data: [], total: 0, page: 1, limit: params.limit ?? 8 }
  return {
    data: (data.data ?? []).map(normalizePublicUniversityItem),
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit,
  }
}

function normalizeTrustedUniversityLogoPage(
  data: TrustedUniversityLogo[] | TrustedUniversityLogoPage | null | undefined,
  limit: number,
  offset: number
): TrustedUniversityLogoPage {
  const normalizeItem = (raw: Partial<TrustedUniversityLogo> | null | undefined): TrustedUniversityLogo | null => {
    if (!raw) return null
    const logoUrl = String(raw.logoUrl ?? raw.logo ?? '').trim()
    if (!logoUrl) return null
    return {
      id: String(raw.id ?? '').trim(),
      name: String(raw.name ?? '').trim() || 'Partner University',
      logoUrl,
      logo: logoUrl,
    }
  }

  if (Array.isArray(data)) {
    const items = data
      .map((item) => normalizeItem(item))
      .filter((item): item is TrustedUniversityLogo => item !== null)
    return {
      items,
      total: items.length,
      limit,
      offset,
      nextOffset: null,
      hasMore: false,
    }
  }

  const items = (Array.isArray(data?.items) ? data.items : [])
    .map((item) => normalizeItem(item))
    .filter((item): item is TrustedUniversityLogo => item !== null)
  const total = typeof data?.total === 'number' && Number.isFinite(data.total) ? data.total : items.length
  const nextOffset =
    typeof data?.nextOffset === 'number' && Number.isFinite(data.nextOffset)
      ? data.nextOffset
      : offset + items.length < total
        ? offset + items.length
        : null

  return {
    items,
    total,
    limit: typeof data?.limit === 'number' && Number.isFinite(data.limit) ? data.limit : limit,
    offset: typeof data?.offset === 'number' && Number.isFinite(data.offset) ? data.offset : offset,
    nextOffset,
    hasMore: typeof data?.hasMore === 'boolean' ? data.hasMore : nextOffset !== null,
  }
}

export async function getTrustedUniversityLogoPage({
  limit = 25,
  offset = 0,
}: {
  limit?: number
  offset?: number
} = {}): Promise<TrustedUniversityLogoPage> {
  const { data } = await api.get<TrustedUniversityLogo[] | TrustedUniversityLogoPage>('/public/trusted-university-logos', {
    params: { limit, offset },
  })
  return normalizeTrustedUniversityLogoPage(data, limit, offset)
}

export async function getTrustedUniversityLogos(limit = 25): Promise<TrustedUniversityLogo[]> {
  const page = await getTrustedUniversityLogoPage({ limit, offset: 0 })
  return page.items
}

export async function trackSiteVisit(path: string): Promise<void> {
  await api.post('/public/analytics/visit', {
    visitorId: getVisitorId(),
    path,
  })
}
