import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import i18n, { loadLanguage } from '@/i18n'
import { STORAGE_KEY, type SupportedLng } from '@/i18n/config'
import { LanguageChoiceButtons } from '@/components/i18n/LanguageChoiceButtons'

interface ChooseLanguageBeforeOnboardingProps {
  open: boolean
  onLanguageSelected: () => void
}

/**
 * Shown only when we cannot infer en/ru/uz from a saved choice or from the browser language list
 * (same rules as `/choose-language`). Layout matches that page: card width, flags, touch targets.
 */
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
      panelClassName="max-w-md w-full"
      contentClassName="p-6 sm:p-6"
      title={
        <span className="text-lg font-semibold leading-snug">
          {t('chooseLanguage', 'Choose language')}
        </span>
      }
      footer={null}
    >
      <p className="mb-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {t(
          'chooseLanguageOnboardingHint',
          'Your browser language is not one of the languages we support yet. Pick English, Russian, or Uzbek to continue — you only need to do this once.'
        )}
      </p>
      <LanguageChoiceButtons onSelect={handleSelect} />
    </Modal>
  )
}
