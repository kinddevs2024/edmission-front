import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyEmail } from '@/services/auth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function VerifyEmail() {
  useTranslation(['common', 'auth'])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      return
    }
    verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [searchParams])

  if (status === 'loading') {
    return (
      <Card className="p-6">
        <p>Loading...</p>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="p-6">
        <CardTitle className="mb-2 text-red-500">Verification failed</CardTitle>
        <Button onClick={() => navigate('/login')}>Go to login</Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardTitle className="mb-2">Email verified</CardTitle>
      <p className="mb-4 text-[var(--color-text-muted)]">You can now sign in.</p>
      <Button onClick={() => navigate('/login')}>Sign in</Button>
    </Card>
  )
}
