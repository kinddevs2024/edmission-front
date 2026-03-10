import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n, { loadLanguage } from '@/i18n'
import { supportedLngs, STORAGE_KEY, type SupportedLng } from '@/i18n/config'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const LANGUAGE_LABELS: Record<SupportedLng, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
}

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
    <Card className="p-6 max-w-md mx-auto">
      <CardTitle className="mb-2">{t('auth:chooseLanguage', 'Choose language')}</CardTitle>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        {t('auth:chooseLanguageHint', 'Select your preferred language.')}
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
    </Card>
  )
}
