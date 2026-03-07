import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { UniversityCard } from '@/components/student/UniversityCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Building2 } from 'lucide-react'
import { getUniversities, showInterest, getApplications, getInterestLimit, getStudentProfile } from '@/services/student'
import type { UniversityListItem } from '@/types/university'

const COUNTRY_OPTIONS = [
  { value: '', label: 'All countries' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'UK' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Netherlands', label: 'Netherlands' },
]
const SORT_OPTIONS = [
  { value: 'match', label: 'Match score' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Rating' },
]

export function ExploreUniversities() {
  const { t } = useTranslation('student')
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [country, setCountry] = useState(searchParams.get('country') ?? '')
  const [city, setCity] = useState(searchParams.get('city') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'match')
  const [list, setList] = useState<UniversityListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [loading, setLoading] = useState(true)
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set())
  const [interestLimit, setInterestLimit] = useState<{ allowed: boolean; current: number; limit: number | null }>({ allowed: true, current: 0, limit: 3 })
  /** When true, backend does not filter by profile (interestedFaculties, preferredCountries). Set by Clear. */
  const [useProfileFilters, setUseProfileFilters] = useState(true)
  const [profileFilterCounts, setProfileFilterCounts] = useState<{ faculties: number; countries: number }>({ faculties: 0, countries: 0 })
  const limit = 12

  useEffect(() => {
    getStudentProfile().then((p) => {
      const faculties = (p.interestedFaculties ?? []).filter(Boolean).length
      const countries = (p.preferredCountries ?? []).filter(Boolean).length
      setProfileFilterCounts({ faculties, countries })
    }).catch(toastApiError)
  }, [])

  useEffect(() => {
    getApplications({ limit: 500 }).then((res) => {
      const ids = new Set((res.data ?? []).map((a) => (a as { universityId?: string }).universityId).filter(Boolean) as string[])
      setInterestedIds(ids)
    }).catch(toastApiError)
    getInterestLimit().then(setInterestLimit).catch(toastApiError)
  }, [])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.q = search
    if (country) params.country = country
    if (city) params.city = city
    if (sort) params.sort = sort
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [search, country, city, sort, page, setSearchParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getUniversities({
      page,
      limit,
      country: country || undefined,
      city: city.trim() || undefined,
      sort: sort as 'match' | 'name' | 'rating',
      useProfileFilters,
    })
      .then((res) => {
        if (!cancelled) {
          setList(res.data ?? [])
          setTotal(res.total ?? 0)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setList([])
          setTotal(0)
          toastApiError(e)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, country, city, sort, useProfileFilters])

  const handleInterest = (id: string) => {
    if (interestedIds.has(id) || !interestLimit.allowed) return
    showInterest(id)
      .then(() => {
        setInterestedIds((s) => new Set(s).add(id))
        setInterestLimit((prev) => ({ ...prev, current: prev.current + 1, allowed: prev.limit === null ? true : prev.current + 1 < prev.limit }))
      })
      .catch(toastApiError)
  }

  const canShowInterest = interestLimit.allowed
  const interestLabel = interestLimit.limit != null ? `${interestLimit.current}/${interestLimit.limit}` : `${interestLimit.current}`

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasFilters = search.trim() !== '' || country !== '' || city.trim() !== '' || sort !== 'match' || useProfileFilters
  const profileCriteriaCount = profileFilterCounts.faculties + profileFilterCounts.countries

  const handleClearFilters = () => {
    setSearch('')
    setCountry('')
    setCity('')
    setSort('match')
    setPage(1)
    setUseProfileFilters(false)
  }

  const handleFilterChange = () => {
    setPage(1)
    setUseProfileFilters(true)
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('exploreUniversities')} icon="GraduationCap" />

      {/* Filters: student-oriented first (sort, country, city, search) */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-[110px] shrink-0">
          <Select
            label="Sort"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => { setSort(e.target.value); handleFilterChange() }}
            className="text-sm py-1.5 h-8"
          />
        </div>
        <div className="w-[120px] shrink-0">
          <Select
            label="Country"
            options={COUNTRY_OPTIONS}
            value={country}
            onChange={(e) => { setCountry(e.target.value); handleFilterChange() }}
            className="text-sm py-1.5 h-8"
          />
        </div>
        <div className="w-[100px] shrink-0">
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => { setCity(e.target.value); handleFilterChange() }}
            className="text-sm py-1.5 h-8"
          />
        </div>
        <div className="w-[150px] shrink-0">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilterChange() }}
            className="text-sm py-1.5 h-8"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            {t('clearFilters')}
          </Button>
        )}
      </div>

      {useProfileFilters && profileCriteriaCount > 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('profileFiltersApplied', 'Using your profile')}: {profileFilterCounts.faculties} {t('faculties', 'faculties')}, {profileFilterCounts.countries} {t('countries', 'countries')} ({profileCriteriaCount} {t('criteriaTotal', 'criteria total')})
        </p>
      )}

      {interestLimit.limit != null && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Interests used: {interestLabel} {!canShowInterest && interestedIds.size >= interestLimit.limit && '(limit reached — upgrade to add more)'}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('noUniversitiesFound')}
            description={t('tryChangingFiltersOrSearch')}
            actionLabel={t('clearFilters')}
            onAction={handleClearFilters}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((u, index) => (
              <div
                key={u.id}
                className="animate-card-enter opacity-0"
                style={{ animationDelay: `${Math.min(index, 9) * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <UniversityCard
                  university={u}
                  showMatch
                  onInterest={handleInterest}
                  interested={interestedIds.has(u.id)}
                  interestDisabled={!canShowInterest}
                />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="py-2 px-4 text-sm text-[var(--color-text-muted)]">
                Page {page} of {totalPages}
              </span>
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
