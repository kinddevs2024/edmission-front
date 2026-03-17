import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function StudentDecisionPanel({
  disabled,
  loadingAction,
  onAccept,
  onDecline,
  onPostpone,
}: {
  disabled?: boolean
  loadingAction?: 'accept' | 'decline' | 'postpone' | null
  onAccept: () => void
  onDecline: () => void
  onPostpone: (days: 3 | 7 | 14) => void
}) {
  const { t } = useTranslation('documents')

  return (
    <Card className="space-y-4 border border-[var(--color-border)]">
      <div>
        <h3 className="text-lg font-semibold">{t('decisionPanel.title', 'Decision')}</h3>
        <p className="text-sm text-[var(--color-text-muted)]">{t('decisionPanel.description', 'Choose one action. Postpone is limited to a single 3/7/14 day decision window.')}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Button onClick={onAccept} disabled={disabled} loading={loadingAction === 'accept'}>
          {t('decisionPanel.accept', 'Accept')}
        </Button>
        <Button variant="secondary" onClick={() => onPostpone(7)} disabled={disabled} loading={loadingAction === 'postpone'}>
          {t('decisionPanel.decideLater', 'Decide later')}
        </Button>
        <Button variant="danger" onClick={onDecline} disabled={disabled} loading={loadingAction === 'decline'}>
          {t('decisionPanel.decline', 'Decline')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => onPostpone(3)} disabled={disabled || loadingAction === 'postpone'}>
          {t('decisionPanel.postponeDays', { count: 3, defaultValue: 'Postpone 3 days' })}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onPostpone(7)} disabled={disabled || loadingAction === 'postpone'}>
          {t('decisionPanel.postponeDays', { count: 7, defaultValue: 'Postpone 7 days' })}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onPostpone(14)} disabled={disabled || loadingAction === 'postpone'}>
          {t('decisionPanel.postponeDays', { count: 14, defaultValue: 'Postpone 14 days' })}
        </Button>
      </div>
    </Card>
  )
}
