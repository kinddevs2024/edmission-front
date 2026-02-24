import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { UniversityCard } from '@/components/student/UniversityCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { getUniversities, showInterest } from '@/services/student'
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

const MOCK_LIST: UniversityListItem[] = [
  { id: '1', name: 'Tech University', country: 'USA', city: 'Boston', description: 'Leading in CS.', matchScore: 92, hasScholarship: true },
  { id: '2', name: 'Global College', country: 'UK', city: 'London', description: 'International programs.', matchScore: 88, hasScholarship: true },
  { id: '3', name: 'Science Institute', country: 'Germany', city: 'Berlin', description: 'Research-focused.', matchScore: 85, hasScholarship: false },
]

export function ExploreUniversities() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [country, setCountry] = useState(searchParams.get('country') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'match')
  const [list, setList] = useState<UniversityListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [loading, setLoading] = useState(true)
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set())
  const limit = 12

  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.q = search
    if (country) params.country = country
    if (sort) params.sort = sort
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [search, country, sort, page, setSearchParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getUniversities({
      page,
      limit,
      country: country || undefined,
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
          setList(MOCK_LIST)
          setTotal(MOCK_LIST.length)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, country, sort])

  const handleInterest = (id: string) => {
    showInterest(id).then(() => setInterestedIds((s) => new Set(s).add(id))).catch(() => {})
    setInterestedIds((s) => new Set(s).add(id))
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <h1 className="text-h1">Explore Universities</h1>

      <div className="flex flex-wrap gap-4 items-end">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          label="Country"
          options={COUNTRY_OPTIONS}
          value={country}
          onChange={(e) => { setCountry(e.target.value); setPage(1) }}
        />
        <Select
          label="Sort"
          options={SORT_OPTIONS}
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1) }}
        />
      </div>

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
            onAction={() => { setSearch(''); setCountry(''); setSort('match'); setPage(1) }}
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
