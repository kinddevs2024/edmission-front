import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'

export function Privacy() {
  const { t } = useTranslation('common')
  const sections = [
    'collected',
    'usage',
    'sharing',
    'security',
    'rights',
    'contact',
  ] as const

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">{t('privacyPage.title', 'Privacy Policy')}</h1>
      <p className="text-[var(--color-text-muted)] mb-8">{t('privacyPage.lastUpdated', 'Last updated: February 2025')}</p>

      <Card className="p-6 space-y-6">
        {sections.map((section) => (
          <section key={section}>
            <CardTitle>{t(`privacyPage.sections.${section}.title`)}</CardTitle>
            <p className="text-[var(--color-text-muted)] mt-2">
              {t(`privacyPage.sections.${section}.body`)}
            </p>
          </section>
        ))}
      </Card>
    </div>
  )
}
