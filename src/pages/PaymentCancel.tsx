import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function PaymentCancel() {
  return (
    <div className="max-w-md mx-auto py-12 text-center">
      <Card className="p-8">
        <CardTitle>Payment cancelled</CardTitle>
        <p className="text-[var(--color-text-muted)] mt-2">
          You cancelled the checkout. No charges were made. You can try again anytime.
        </p>
        <Button className="mt-6" to="/payment">
          Back to subscription
        </Button>
      </Card>
    </div>
  )
}
