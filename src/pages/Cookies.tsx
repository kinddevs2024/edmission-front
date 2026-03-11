import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'

export function Cookies() {
  const { t } = useTranslation('cookies')

  const sections = [
    { titleKey: 's1Title', bodyKey: 's1Body' },
    { titleKey: 's2Title', bodyKey: 's2Body' },
    { titleKey: 's3Title', bodyKey: 's3Body' },
    { titleKey: 's4Title', bodyKey: 's4Body' },
    { titleKey: 's5Title', bodyKey: 's5Body' },
    { titleKey: 's6Title', bodyKey: 's6Body' },
  ] as const

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
        {t('title')}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        {t('lastUpdated')}
      </p>

      <p className="text-[var(--color-text)] mb-8 leading-relaxed">
        {t('intro')}
      </p>

      <Card className="p-6 space-y-6">
        {sections.map(({ titleKey, bodyKey }) => (
          <section key={titleKey}>
            <CardTitle>{t(titleKey)}</CardTitle>
            <p className="text-[var(--color-text-muted)] mt-2 leading-relaxed whitespace-pre-line">
              {t(bodyKey)}
            </p>
          </section>
        ))}
      </Card>
    </div>
  )
}
