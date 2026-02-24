import { Card, CardTitle } from '@/components/ui/Card'

export function Discovery() {
  return (
    <div className="space-y-4">
      <h1 className="text-h1">Discovery — Students</h1>
      <Card>
        <CardTitle>Student cards</CardTitle>
        <p className="text-[var(--color-text-muted)]">No students to show. Filters and list from API.</p>
      </Card>
    </div>
  )
}
