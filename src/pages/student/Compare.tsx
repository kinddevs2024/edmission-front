import { useState, useEffect } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { getApplications } from '@/services/student'
import { api } from '@/services/api'
import type { UniversityListItem } from '@/types/university'

const MAX_COMPARE = 4

export function Compare() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [universities, setUniversities] = useState<UniversityListItem[]>([])
  const [allOptions, setAllOptions] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApplications({ limit: 100 })
      .then((res) => {
        const ids = [...new Set((res.data ?? []).map((a) => a.universityId))]
        if (ids.length === 0) {
          setAllOptions([])
          return
        }
        return api.get<{ data?: UniversityListItem[] }>('/universities', { params: { ids: ids.join(','), limit: 50 } })
          .then((r) => {
            const list = r.data?.data ?? []
            setAllOptions(list.map((u) => ({ value: u.id, label: u.name })))
          })
      })
      .catch(() => setAllOptions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedIds.length === 0) {
      setUniversities([])
      return
    }
    api.get<{ data?: UniversityListItem[] }>('/universities', { params: { ids: selectedIds.join(',') } })
      .then((r) => setUniversities(r.data?.data ?? []))
      .catch(() => setUniversities([]))
  }, [selectedIds])

  const addId = (id: string) => {
    if (selectedIds.length >= MAX_COMPARE || selectedIds.includes(id)) return
    setSelectedIds((s) => [...s, id])
  }

  const removeId = (id: string) => {
    setSelectedIds((s) => s.filter((x) => x !== id))
  }

  const rows = [
    { label: 'Name', key: 'name' as const },
    { label: 'Country', key: 'country' as const },
    { label: 'City', key: 'city' as const },
    { label: 'Rating', key: 'rating' as const },
    { label: 'Match %', key: 'matchScore' as const },
    { label: 'Scholarship', key: 'hasScholarship' as const },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-h1">Compare Universities</h1>

      <Card>
        <CardTitle>Select up to {MAX_COMPARE} universities</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">Choose from your interested universities.</p>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        ) : allOptions.length === 0 ? (
          <p className="text-[var(--color-text-muted)] mb-4">No universities in your list yet. Show interest on Explore page.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            <Select
              options={[{ value: '', label: 'Add university...' }, ...allOptions.filter((o) => !selectedIds.includes(o.value))]}
              value=""
              onChange={(e) => { const v = e.target.value; if (v) addId(v) }}
              className="max-w-xs"
            />
            {selectedIds.map((id) => {
              const opt = allOptions.find((o) => o.value === id)
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded-input bg-[var(--color-border)] px-2 py-1 text-sm">
                  {opt?.label ?? id}
                  <button type="button" onClick={() => removeId(id)} className="hover:opacity-70" aria-label="Remove">×</button>
                </span>
              )
            })}
          </div>
        )}
        <Button to="/student/universities" variant="secondary">Explore universities</Button>
      </Card>

      {universities.length > 0 && (
        <Card>
          <CardTitle>Comparison</CardTitle>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh className="min-w-[120px]">Criteria</TableTh>
                  {universities.map((u) => (
                    <TableTh key={u.id} className="min-w-[160px]">
                      <div className="font-medium">{u.name}</div>
                      <Button to={`/student/universities/${u.id}`} variant="ghost" size="sm" className="mt-1">View</Button>
                    </TableTh>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(({ label, key }) => (
                  <TableRow key={key}>
                    <TableTd className="font-medium">{label}</TableTd>
                    {universities.map((u) => (
                      <TableTd key={u.id}>
                        {key === 'hasScholarship' ? (u.hasScholarship ? 'Yes' : 'No') : String((u as unknown as Record<string, unknown>)[key] ?? '—')}
                      </TableTd>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
