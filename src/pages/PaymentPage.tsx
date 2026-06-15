import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/services/auth'
import { createCheckoutSession } from '@/services/payment'
import { getApiError } from '@/services/auth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { getNavIcon } from '@/components/icons/NavIcons'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { isUniversityLikeRole } from '@/types/user'
import { getActAsUniversityUserId } from '@/constants/actAsUniversity'
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
  const { t } = useTranslation(['common', 'university'])
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const isMultiUniversityRole = user?.role === 'university_multi_manager' || user?.role === 'multi_university_admin'
  const actAsUniversityUserId = isMultiUniversityRole ? getActAsUniversityUserId() : null
  const sub = isMultiUniversityRole ? undefined : user?.subscription
  const isStudent = user?.role === 'student'
  const isUniversity = isUniversityLikeRole(user?.role)
  const userId = user?.id
  const hasSubscription = Boolean(user?.subscription)

  useEffect(() => {
    if (userId && !hasSubscription) {
      setLoading(true)
      getProfile()
        .then(() => setLoading(false))
        .catch(() => setLoading(false))
    }
  }, [hasSubscription, userId])

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

  if (!user) return null

  if (user.role !== 'student' && !isUniversityLikeRole(user.role)) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-page-bottom-cta">
        <PageTitle title={t('subscriptionAndPayment')} icon="CreditCard" />
        <Card>
          <p className="text-[var(--color-text-muted)]">{t('subscriptionPlansHint')}</p>
        </Card>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">{t('studentPlans', 'Student plans')}</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {STUDENT_PLANS.map((plan) => (
              <Card key={plan.id} className={cn('p-5 min-h-[180px] flex flex-col', plan.highlight && 'ring-2 ring-primary-accent')}>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-[var(--color-text-muted)]">
                  <li>{plan.apps}</li><li>Period: {plan.period}</li><li>Chat: {plan.chat}</li>
                </ul>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">{t('universityPlans', 'University plans')}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {UNIVERSITY_PLANS.map((plan) => (
              <Card key={plan.id} className={cn('p-5 min-h-[180px] flex flex-col', plan.highlight && 'ring-2 ring-primary-accent')}>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-[var(--color-text-muted)]">
                  <li>{plan.requests}</li><li>Chat: {plan.chat}</li>
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isMultiUniversityRole && !actAsUniversityUserId) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-4 pb-page-bottom-cta">
        <PageTitle title={t('subscriptionAndPayment')} icon="CreditCard" />
        <Card>
          <CardTitle>{t('university:selectUniversity', 'Select university')}</CardTitle>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {t('university:selectUniversityBeforePayment', 'Choose a university before opening payment and subscription settings.')}
          </p>
          <Button to="/university-multi-manager" className="mt-4">
            {t('university:multiManagerOpenHub', 'Open universities')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-page-bottom-cta">
      <PageTitle title={t('subscriptionAndPayment')} icon="CreditCard" />
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {sub && (
        <Card>
          <CardTitle>{t('currentPlan')}</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="font-medium capitalize">{sub.plan.replace(/_/g, ' ')}</span>
            {sub.trialEndsAt && (
              <span className="text-sm text-[var(--color-text-muted)]">
                {t('trialEnds', 'Trial ends')}: {formatDate(sub.trialEndsAt)}
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
            <div className="grid gap-5 sm:grid-cols-3">
              {STUDENT_PLANS.map((plan) => (
                <Card key={plan.id} className={cn('p-5 min-h-[200px] flex flex-col', plan.highlight && 'ring-2 ring-primary-accent')} interactive>
                  <div className="flex items-center gap-2">
                    {getNavIcon('CreditCard', 'size-5 text-primary-accent')}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <ul className="mt-3 text-sm text-[var(--color-text-muted)] space-y-1.5 flex-1">
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
                    {sub?.plan === plan.id ? t('currentPlan') : t('upgrade', 'Upgrade')}
                  </Button>
                </Card>
              ))}
            </div>
          )}
          {isUniversity && (
            <div className="grid gap-5 sm:grid-cols-2">
              {UNIVERSITY_PLANS.map((plan) => (
                <Card key={plan.id} className={cn('p-5 min-h-[200px] flex flex-col', plan.highlight && 'ring-2 ring-primary-accent')} interactive>
                  <div className="flex items-center gap-2">
                    {getNavIcon('CreditCard', 'size-5 text-primary-accent')}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <ul className="mt-3 text-sm text-[var(--color-text-muted)] space-y-1.5 flex-1">
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
                    {sub?.plan === plan.id ? t('currentPlan') : t('upgrade', 'Upgrade')}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('subscriptionSupportHint', 'Need help? Contact support for plan changes or billing questions.')}
        </p>
        <Button variant="secondary" size="sm" className="mt-3" to="/support">
          {t('contactSupport', 'Contact support')}
        </Button>
      </Card>
    </div>
  )
}
