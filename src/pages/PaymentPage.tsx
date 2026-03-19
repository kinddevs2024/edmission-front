import { useEffect, useMemo, useState } from 'react'
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

const getOrigin = () => typeof window !== 'undefined' ? window.location.origin : ''

export function PaymentPage() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const sub = user?.subscription
  const isStudent = user?.role === 'student'
  const isUniversity = user?.role === 'university'

  const studentPlans = useMemo(() => [
    {
      id: 'student_free_trial',
      name: t('paymentPage.plans.student.freeTrial.name', 'Free Trial'),
      apps: t('paymentPage.plans.student.freeTrial.apps', '3 applications'),
      period: t('paymentPage.plans.student.freeTrial.period', '14 days'),
      chat: t('paymentPage.plans.student.freeTrial.chat', 'DeepSeek'),
      highlight: false,
    },
    {
      id: 'student_standard',
      name: t('paymentPage.plans.student.standard.name', 'Standard'),
      apps: t('paymentPage.plans.student.standard.apps', '15 applications'),
      period: t('paymentPage.plans.student.standard.period', '?'),
      chat: t('paymentPage.plans.student.standard.chat', 'DeepSeek v16'),
      highlight: true,
    },
    {
      id: 'student_max_premium',
      name: t('paymentPage.plans.student.maxPremium.name', 'Max Premium'),
      apps: t('paymentPage.plans.student.maxPremium.apps', 'Unlimited'),
      period: t('paymentPage.plans.student.maxPremium.period', '?'),
      chat: t('paymentPage.plans.student.maxPremium.chat', 'ChatGPT-4'),
      highlight: false,
    },
  ], [t])

  const universityPlans = useMemo(() => [
    {
      id: 'university_free',
      name: t('paymentPage.plans.university.free.name', 'Free'),
      requests: t('paymentPage.plans.university.free.requests', '15 student requests'),
      chat: t('paymentPage.plans.university.free.chat', 'Basic'),
      highlight: false,
    },
    {
      id: 'university_premium',
      name: t('paymentPage.plans.university.premium.name', 'Premium'),
      requests: t('paymentPage.plans.university.premium.requests', 'Unlimited'),
      chat: t('paymentPage.plans.university.premium.chat', 'ChatGPT-4'),
      highlight: true,
    },
  ], [t])

  useEffect(() => {
    if (user && !user.subscription) {
      setLoading(true)
      getProfile()
        .then(() => setLoading(false))
        .catch(() => setLoading(false))
    }
  }, [user?.id, user?.subscription])

  const handleUpgrade = async (planId: string) => {
    setError('')
    setCheckoutLoading(planId)
    const origin = getOrigin()
    try {
      const url = await createCheckoutSession(
        planId,
        origin + '/payment/success',
        origin + '/payment/cancel'
      )
      window.location.href = url
    } catch (err) {
      setError(getApiError(err).message)
      setCheckoutLoading(null)
    }
  }

  if (!user || (user.role !== 'student' && user.role !== 'university')) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <PageTitle title={t('subscription')} icon="CreditCard" />
        <Card>
          <p className="text-[var(--color-text-muted)]">{t('subscriptionPlansHint')}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
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
                {t('paymentPage.trialEnds', 'Trial ends')}: {new Date(sub.trialEndsAt).toLocaleDateString()}
              </span>
            )}
            {isStudent && sub.applicationLimit != null && (
              <span className="text-sm">
                {t('paymentPage.applications', 'Applications')}: {sub.applicationCurrent} / {sub.applicationLimit}
              </span>
            )}
            {isUniversity && sub.offerLimit != null && (
              <span className="text-sm">
                {t('paymentPage.requests', 'Requests')}: {sub.offerCurrent} / {sub.offerLimit}
              </span>
            )}
          </div>
        </Card>
      )}

      {loading && !sub ? (
        <Card><p className="text-[var(--color-text-muted)]">{t('loading')}</p></Card>
      ) : (
        <>
          {isStudent && (
            <div className="grid gap-5 sm:grid-cols-3">
              {studentPlans.map((plan) => (
                <Card key={plan.id} className={cn('p-5 min-h-[200px] flex flex-col', plan.highlight && 'ring-2 ring-primary-accent')} interactive>
                  <div className="flex items-center gap-2">
                    {getNavIcon('CreditCard', 'size-5 text-primary-accent')}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <ul className="mt-3 text-sm text-[var(--color-text-muted)] space-y-1.5 flex-1">
                    <li>{plan.apps}</li>
                    <li>{t('paymentPage.period', 'Period')}: {plan.period}</li>
                    <li>{t('paymentPage.chat', 'Chat')}: {plan.chat}</li>
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
              {universityPlans.map((plan) => (
                <Card key={plan.id} className={cn('p-5 min-h-[200px] flex flex-col', plan.highlight && 'ring-2 ring-primary-accent')} interactive>
                  <div className="flex items-center gap-2">
                    {getNavIcon('CreditCard', 'size-5 text-primary-accent')}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <ul className="mt-3 text-sm text-[var(--color-text-muted)] space-y-1.5 flex-1">
                    <li>{plan.requests}</li>
                    <li>{t('paymentPage.chat', 'Chat')}: {plan.chat}</li>
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
          {t('paymentPage.help', 'Need help? Contact support for plan changes or billing questions.')}
        </p>
        <Button variant="secondary" size="sm" className="mt-3" to="/support">
          {t('contactSupport', 'Contact support')}
        </Button>
      </Card>
    </div>
  )
}
