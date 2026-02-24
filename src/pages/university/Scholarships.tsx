import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { getScholarships, createScholarship } from '@/services/university'
import { formatDate } from '@/utils/format'
import type { Scholarship } from '@/types/university'

export function Scholarships() {
  const [list, setList] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [coveragePercent, setCoveragePercent] = useState(100)
  const [maxSlots, setMaxSlots] = useState(10)
  const [deadline, setDeadline] = useState('')
  const [eligibility, setEligibility] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getScholarships({ limit: 100 })
      .then((res) => setList(res.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = () => {
    setSubmitting(true)
    createScholarship({ name, coveragePercent, maxSlots, deadline, eligibility })
      .then((newOne) => {
        setList((prev) => [newOne, ...prev])
        setModalOpen(false)
        setName('')
        setCoveragePercent(100)
        setMaxSlots(10)
        setDeadline('')
        setEligibility('')
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-h1">Scholarships</h1>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>Scholarship list</CardTitle>
          <Button onClick={() => setModalOpen(true)}>Create scholarship</Button>
        </div>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8">No scholarships yet. Create one to start.</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Name</TableTh>
                <TableTh>Coverage</TableTh>
                <TableTh>Slots</TableTh>
                <TableTh>Deadline</TableTh>
                <TableTh>Eligibility</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableTd>{s.name}</TableTd>
                  <TableTd>{s.coveragePercent}%</TableTd>
                  <TableTd>{s.usedSlots} / {s.maxSlots}</TableTd>
                  <TableTd>{formatDate(s.deadline)}</TableTd>
                  <TableTd className="max-w-xs truncate">{s.eligibility ?? '—'}</TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create scholarship"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Coverage %" type="number" value={coveragePercent} onChange={(e) => setCoveragePercent(Number(e.target.value))} />
          <Input label="Max slots" type="number" value={maxSlots} onChange={(e) => setMaxSlots(Number(e.target.value))} />
          <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <label className="block">
            <span className="block text-sm font-medium mb-1">Eligibility</span>
            <textarea className="w-full rounded-input border px-3 py-2" rows={3} value={eligibility} onChange={(e) => setEligibility(e.target.value)} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
