import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/services/auth'
import { createCheckoutSession } from '@/services/payment'
import { getApiError } from '@/services/auth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { getNavIcon } from '@/components/icons/NavIcons'
const STUDENT_PLANS = [
  { id: 'student_free_trial', name: 'Free Trial', apps: '3 applications', period: '14 days', chat: 'DeepSeek', highlight: false },
  { id: 'student_standard', name: 'Standard', apps: '15 applications', period: '—', chat: 'DeepSeek v16', highlight: true },
  { id: 'student_max_premium', name: 'Max Premium', apps: 'Unlimited', period: '—', chat: 'ChatGPT-4', highlight: false },
]

const UNIVERSITY_PLANS = [
  { id: 'university_free', name: 'Free', requests: '15 student requests', chat: 'Basic', highlight: false },
  { id: 'university_premium', name: 'Premium', requests: 'Unlimited', chat: 'ChatGPT-4', highlight: true },
]

const getOrigin = () => typeof window !== 'undefined' ? window.location.origin : ''

export function PaymentPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const sub = user?.subscription
  const isStudent = user?.role === 'student'
  const isUniversity = user?.role === 'university'

  useEffect(() => {
    if (user && !user.subscription) {
      setLoading(true)
      getProfile()
        .then(() => setLoading(false))
        .catch(() => setLoading(false))
    }
  }, [user?.id])

  const handleUpgrade = async (planId: string) => {
    setError('')
    setCheckoutLoading(planId)
    const origin = getOrigin()
    try {
      const url = await createCheckoutSession(
        planId,
        `${origin}/payment/success`,
        `${origin}/payment/cancel`
      )
      window.location.href = url
    } catch (err) {
      setError(getApiError(err).message)
      setCheckoutLoading(null)
    }
  }

  if (!user || (user.role !== 'student' && user.role !== 'university')) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageTitle title="Subscription" icon="CreditCard" />
        <Card>
          <p className="text-[var(--color-text-muted)]">Subscription plans are available for students and universities.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle title="Subscription & Payment" icon="CreditCard" />
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {sub && (
        <Card>
          <CardTitle>Current plan</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="font-medium capitalize">{sub.plan.replace(/_/g, ' ')}</span>
            {sub.trialEndsAt && (
              <span className="text-sm text-[var(--color-text-muted)]">
                Trial ends: {new Date(sub.trialEndsAt).toLocaleDateString()}
              </span>
            )}
            {isStudent && sub.applicationLimit != null && (
              <span className="text-sm">
                Applications: {sub.applicationCurrent} / {sub.applicationLimit}
              </span>
            )}
            {isUniversity && sub.offerLimit != null && (
              <span className="text-sm">
                Requests: {sub.offerCurrent} / {sub.offerLimit}
              </span>
            )}
          </div>
        </Card>
      )}

      {loading && !sub ? (
        <Card><p className="text-[var(--color-text-muted)]">Loading…</p></Card>
      ) : (
        <>
          {isStudent && (
            <div className="grid gap-4 sm:grid-cols-3">
              {STUDENT_PLANS.map((plan) => (
                <Card key={plan.id} className={plan.highlight ? 'ring-2 ring-primary-accent' : ''}>
                  <div className="flex items-center gap-2">
                    {getNavIcon('CreditCard', 'size-5 text-primary-accent')}
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <ul className="mt-2 text-sm text-[var(--color-text-muted)] space-y-1">
                    <li>{plan.apps}</li>
                    <li>Period: {plan.period}</li>
                    <li>Chat: {plan.chat}</li>
                  </ul>
                  <Button
                    variant={sub?.plan === plan.id ? 'secondary' : 'primary'}
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => sub?.plan !== plan.id && handleUpgrade(plan.id)}
                    disabled={sub?.plan === plan.id || checkoutLoading === plan.id}
                    loading={checkoutLoading === plan.id}
                  >
                    {sub?.plan === plan.id ? 'Current plan' : 'Upgrade'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
          {isUniversity && (
            <div className="grid gap-4 sm:grid-cols-2">
              {UNIVERSITY_PLANS.map((plan) => (
                <Card key={plan.id} className={plan.highlight ? 'ring-2 ring-primary-accent' : ''}>
                  <div className="flex items-center gap-2">
                    {getNavIcon('CreditCard', 'size-5 text-primary-accent')}
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <ul className="mt-2 text-sm text-[var(--color-text-muted)] space-y-1">
                    <li>{plan.requests}</li>
                    <li>Chat: {plan.chat}</li>
                  </ul>
                  <Button
                    variant={sub?.plan === plan.id ? 'secondary' : 'primary'}
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => sub?.plan !== plan.id && handleUpgrade(plan.id)}
                    disabled={sub?.plan === plan.id || checkoutLoading === plan.id}
                    loading={checkoutLoading === plan.id}
                  >
                    {sub?.plan === plan.id ? 'Current plan' : 'Upgrade'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          Need help? Contact support for plan changes or billing questions.
        </p>
        <Button variant="secondary" size="sm" className="mt-3" to="/support">
          Contact support
        </Button>
      </Card>
    </div>
  )
}
