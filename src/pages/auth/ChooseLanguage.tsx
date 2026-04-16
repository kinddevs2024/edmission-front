import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n, { loadLanguage } from '@/i18n'
import { STORAGE_KEY, type SupportedLng } from '@/i18n/config'
import { Card, CardTitle } from '@/components/ui/Card'
import { LanguageChoiceButtons } from '@/components/i18n/LanguageChoiceButtons'

export function ChooseLanguage() {
  const { t } = useTranslation(['common', 'auth'])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const next = searchParams.get('next') || '/login'

  const handleSelect = async (lng: SupportedLng) => {
    await loadLanguage(lng)
    i18n.changeLanguage(lng)
    try {
      localStorage.setItem(STORAGE_KEY, lng)
    } catch {
      /* ignore */
    }
    navigate(next, { replace: true })
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <CardTitle className="mb-2">{t('auth:chooseLanguage', 'Choose language')}</CardTitle>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        {t('auth:chooseLanguageHint', 'Select your preferred language.')}
      </p>
      <LanguageChoiceButtons onSelect={handleSelect} />
    </Card>
  )
}
