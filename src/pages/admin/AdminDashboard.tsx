import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getAdminStats, getVerificationQueue } from '@/services/admin'
import type { AdminStats as AdminStatsType } from '@/services/admin'

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsType | null>(null)
  const [verificationCount, setVerificationCount] = useState(0)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setStats({
        studentsCount: 0,
        universitiesCount: 0,
        activeOffersCount: 0,
        healthStatus: 'ok',
      }))
  }, [])

  useEffect(() => {
    getVerificationQueue()
      .then((list) => setVerificationCount(list.length))
      .catch(() => setVerificationCount(0))
  }, [])

  const healthLabel = stats?.healthStatus === 'ok' ? 'OK' : stats?.healthStatus === 'degraded' ? 'Degraded' : 'Error'
  const healthClass = stats?.healthStatus === 'ok' ? 'text-[#22C55E]' : stats?.healthStatus === 'degraded' ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="space-y-6">
      <h1 className="text-h1">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardTitle>Students</CardTitle>
          <p className="text-2xl font-semibold">{stats?.studentsCount ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>Universities</CardTitle>
          <p className="text-2xl font-semibold">{stats?.universitiesCount ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>Active offers</CardTitle>
          <p className="text-2xl font-semibold">{stats?.activeOffersCount ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>System health</CardTitle>
          <p className={`text-2xl font-semibold ${healthClass}`}>{healthLabel}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Verification queue</CardTitle>
          <p className="text-[var(--color-text-muted)] mb-3">
            {verificationCount} universit{verificationCount === 1 ? 'y' : 'ies'} pending verification.
          </p>
          <Button to="/admin/verification" variant="secondary">View queue</Button>
        </Card>
        <Card>
          <CardTitle>Quick links</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button to="/admin/users" variant="secondary" size="sm">Users</Button>
            <Button to="/admin/logs" variant="secondary" size="sm">Audit logs</Button>
            <Button to="/admin/health" variant="secondary" size="sm">System health</Button>
            <Button to="/admin/scholarships" variant="secondary" size="sm">Scholarships</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
