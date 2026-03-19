import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

export function PaymentSuccess() {
  const { t } = useTranslation('common')

  return (
    <div className="max-w-md mx-auto py-12 text-center">
      <Card className="p-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden />
        <CardTitle>{t('paymentSuccessTitle', 'Payment successful')}</CardTitle>
        <p className="text-[var(--color-text-muted)] mt-2">
          {t('paymentSuccessDescription', 'Your subscription has been updated. You can now use your new plan features.')}
        </p>
        <Button className="mt-6" to="/payment">
          {t('backToSubscription', 'Back to subscription')}
        </Button>
      </Card>
    </div>
  )
}
