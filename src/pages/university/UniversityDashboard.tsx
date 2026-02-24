import { Card, CardTitle } from '@/components/ui/Card'

export function UniversityDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1">University Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardTitle>New interests</CardTitle><p className="text-2xl font-semibold">0</p></Card>
        <Card><CardTitle>Active chats</CardTitle><p className="text-2xl font-semibold">0</p></Card>
        <Card><CardTitle>Offers sent</CardTitle><p className="text-2xl font-semibold">0</p></Card>
        <Card><CardTitle>Acceptance rate</CardTitle><p className="text-2xl font-semibold">—</p></Card>
      </div>
      <Card>
        <CardTitle>Pipeline funnel</CardTitle>
        <p className="text-[var(--color-text-muted)]">Interested → Contacted → Evaluating → Offer Sent → Accepted</p>
      </Card>
    </div>
  )
}
