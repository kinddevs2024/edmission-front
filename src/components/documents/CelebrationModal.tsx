import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { BackgroundLines } from '@/components/ui/background-lines'
import { PartyPopper } from 'lucide-react'
import type { DocumentType } from '@/types/documentModule'

export function CelebrationModal({
  open,
  universityName,
  type,
  onView,
  onClose,
}: {
  open: boolean
  universityName: string
  type: DocumentType
  onView: () => void
  onClose: () => void
}) {
  const { t } = useTranslation('documents')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={(
        <div className="flex items-center gap-2">
          <PartyPopper className="w-5 h-5 text-[var(--color-primary-accent)]" />
          <span>{type === 'offer'
            ? t('celebration.receivedOfferTitle', 'You received an Offer')
            : t('celebration.receivedScholarshipTitle', 'You received a Scholarship')}</span>
        </div>
      )}
      footer={<Button onClick={onView}>{t('celebration.viewDocument', 'View document')}</Button>}
    >
      <BackgroundLines
        className="relative h-auto min-h-[260px] md:h-auto overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_55%,#ecfeff_100%)] p-8 text-center dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.96)_55%,rgba(6,78,59,0.28)_100%)]"
        svgOptions={{ duration: 12 }}
      >
        <div className="relative space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('celebration.congratulations', 'Congratulations')}</p>
          <h3 className="text-3xl font-semibold text-[var(--color-text)]">{universityName}</h3>
          <p className="mx-auto max-w-xl text-sm text-[var(--color-text-muted)]">
            {type === 'offer'
              ? t('celebration.offerDescription', 'Your personalized offer is ready. Open it to review the full details and make a decision.')
              : t('celebration.scholarshipDescription', 'Your personalized scholarship is ready. Open it to review the full details and make a decision.')}
          </p>
        </div>
      </BackgroundLines>
    </Modal>
  )
}
