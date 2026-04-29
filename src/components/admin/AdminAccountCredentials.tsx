import { useEffect, useState } from 'react'
import { getAdminUser } from '@/services/admin'
import { Card, CardTitle } from '@/components/ui/Card'

interface AdminAccountCredentialsProps {
  userId: string
}

export function AdminAccountCredentials({ userId }: AdminAccountCredentialsProps) {
  const [email, setEmail] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAdminUser(userId)
      .then((user) => {
        if (cancelled) return
        setEmail(String(user.email ?? ''))
        setTemporaryPassword(String(user.temporaryPassword ?? ''))
      })
      .catch(() => {
        if (cancelled) return
        setEmail('')
        setTemporaryPassword('')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <Card className="border-primary-accent/25 bg-[var(--color-bg-muted)]/40">
      <CardTitle className="text-base">Account credentials</CardTitle>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Login</p>
          <p className="mt-1 truncate font-medium text-[var(--color-text)]">{loading ? 'Loading...' : email || '-'}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Password</p>
          <p className="mt-1 truncate font-medium text-[var(--color-text)]">
            {loading ? 'Loading...' : temporaryPassword || 'Not stored'}
          </p>
        </div>
      </div>
    </Card>
  )
}
