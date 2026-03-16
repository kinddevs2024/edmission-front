import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import i18n, { loadLanguage } from '@/i18n'
import { supportedLngs, STORAGE_KEY, type SupportedLng } from '@/i18n/config'

const LANGUAGE_LABELS: Record<SupportedLng, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
}

interface ChooseLanguageBeforeOnboardingProps {
  open: boolean
  onLanguageSelected: () => void
}

/** Shown when browser language is not supported; after selection we run onboarding in the chosen language. */
export function ChooseLanguageBeforeOnboarding({ open, onLanguageSelected }: ChooseLanguageBeforeOnboardingProps) {
  const { t } = useTranslation('auth')

  const handleSelect = async (lng: SupportedLng) => {
    await loadLanguage(lng)
    i18n.changeLanguage(lng)
    try {
      localStorage.setItem(STORAGE_KEY, lng)
    } catch {
      /* ignore */
    }
    onLanguageSelected()
  }

  return (
    <Modal
      open={open}
      onClose={() => {}}
      title={t('chooseLanguage', 'Choose language')}
      footer={null}
    >
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        {t('chooseLanguageHint', 'Select your preferred language for the tour.')}
      </p>
      <div className="flex flex-col gap-2">
        {supportedLngs.map((lng) => (
          <Button
            key={lng}
            variant="secondary"
            className="w-full justify-center"
            onClick={() => handleSelect(lng)}
          >
            {LANGUAGE_LABELS[lng]}
          </Button>
        ))}
      </div>
    </Modal>
  )
}
