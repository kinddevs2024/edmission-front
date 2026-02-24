import { useState, useEffect } from 'react'
import { getRecommendations } from '@/services/student'
import { api } from '@/services/api'
import type { UniversityListItem } from '@/types/university'

/** Fetch recommended universities (recommendation IDs + university details). Returns mock-friendly list. */
export function useRecommendationUniversities(limit = 5) {
  const [list, setList] = useState<UniversityListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getRecommendations({ limit })
      .then((recs) => {
        if (cancelled || !recs.data?.length) {
          setList([])
          return
        }
        const ids = recs.data.map((r) => r.universityId).slice(0, limit)
        return api
          .get<{ data?: UniversityListItem[] }>('/universities', { params: { ids: ids.join(','), limit } })
          .then((res) => {
            if (cancelled) return
            const data = res.data?.data ?? []
            setList(
              data.map((u) => ({
                ...u,
                matchScore: recs.data?.find((r) => r.universityId === u.id)?.matchScore ?? u.matchScore,
                matchBreakdown: recs.data?.find((r) => r.universityId === u.id)?.breakdown ?? u.matchBreakdown,
              }))
            )
          })
      })
      .catch(() => {
        if (!cancelled) setList([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [limit])

  return { list, loading }
}
