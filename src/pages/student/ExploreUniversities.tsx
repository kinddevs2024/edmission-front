import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { UniversityCard } from '@/components/student/UniversityCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { getUniversities, showInterest, getApplications, getInterestLimit } from '@/services/student'
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
  const limit = 12

  useEffect(() => {
    getApplications({ limit: 500 }).then((res) => {
      const ids = new Set((res.data ?? []).map((a) => (a as { universityId?: string }).universityId).filter(Boolean) as string[])
      setInterestedIds(ids)
    }).catch(() => {})
    getInterestLimit().then(setInterestLimit).catch(() => {})
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
    })
      .then((res) => {
        if (!cancelled) {
          setList(res.data ?? [])
          setTotal(res.total ?? 0)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setList([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, country, city, sort])

  const handleInterest = (id: string) => {
    if (interestedIds.has(id) || !interestLimit.allowed) return
    showInterest(id)
      .then(() => {
        setInterestedIds((s) => new Set(s).add(id))
        setInterestLimit((prev) => ({ ...prev, current: prev.current + 1, allowed: prev.limit === null ? true : prev.current + 1 < prev.limit }))
      })
      .catch(() => {})
  }

  const canShowInterest = interestLimit.allowed
  const interestLabel = interestLimit.limit != null ? `${interestLimit.current}/${interestLimit.limit}` : `${interestLimit.current}`

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <PageTitle title="Explore Universities" icon="GraduationCap" />

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-[150px] shrink-0">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm py-1.5 h-8"
          />
        </div>
        <div className="w-[120px] shrink-0">
          <Select
            label="Country"
            options={COUNTRY_OPTIONS}
            value={country}
            onChange={(e) => { setCountry(e.target.value); setPage(1) }}
            className="text-sm py-1.5 h-8"
          />
        </div>
        <div className="w-[100px] shrink-0">
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1) }}
            className="text-sm py-1.5 h-8"
          />
        </div>
        <div className="w-[110px] shrink-0">
          <Select
            label="Sort"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="text-sm py-1.5 h-8"
          />
        </div>
      </div>

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
            title="No universities found"
            description="Try changing filters or search to see more results."
            actionLabel="Clear filters"
            onAction={() => { setSearch(''); setCountry(''); setCity(''); setSort('match'); setPage(1) }}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((u) => (
              <UniversityCard
                key={u.id}
                university={u}
                showMatch
                onInterest={handleInterest}
                interested={interestedIds.has(u.id)}
                interestDisabled={!canShowInterest}
              />
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
