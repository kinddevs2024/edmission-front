import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
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
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top,#fef3c7,transparent_45%),linear-gradient(135deg,#eff6ff_0%,#f8fafc_55%,#ecfeff_100%)] p-8 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-pink-400/15 blur-2xl" />
          <div className="absolute right-12 top-12 h-16 w-16 rounded-full bg-sky-400/20 blur-2xl" />
          <div className="absolute bottom-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-2xl" />
        </div>
        <div className="relative space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('celebration.congratulations', 'Congratulations')}</p>
          <h3 className="text-3xl font-semibold text-[var(--color-text)]">{universityName}</h3>
          <p className="mx-auto max-w-xl text-sm text-[var(--color-text-muted)]">
            {type === 'offer'
              ? t('celebration.offerDescription', 'Your personalized offer is ready. Open it to review the full details and make a decision.')
              : t('celebration.scholarshipDescription', 'Your personalized scholarship is ready. Open it to review the full details and make a decision.')}
          </p>
        </div>
      </div>
    </Modal>
  )
}
