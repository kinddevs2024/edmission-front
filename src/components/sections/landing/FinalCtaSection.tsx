import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

export function FinalCtaSection() {
  const { t } = useTranslation('landing')
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <Card className="p-8 md:p-12" interactive>
          <SectionHeading
            align="center"
            eyebrow={t('finalCta.eyebrow')}
            title={t('finalCta.title')}
            description={t('finalCta.description')}
            actions={(
              <>
                <Button to="/register" size="lg">{t('finalCta.studentBtn')}</Button>
                <Button to="/register?role=university" variant="secondary" size="lg">{t('finalCta.universityBtn')}</Button>
              </>
            )}
          />
        </Card>
      </Reveal>
    </section>
  )
}
