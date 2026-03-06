import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Reveal } from './Reveal'

export function CtaBlock() {
  const { t } = useTranslation('landing')
  return (
    <Reveal>
      <section className="mx-auto max-w-3xl px-4 py-12 text-center md:px-6">
        <h2 className="text-2xl font-semibold text-[var(--color-text)]">
          {t('ctaBlock.title')}
        </h2>
        <p className="mt-3 text-[var(--color-text-muted)]">
          {t('ctaBlock.description')}
        </p>
        <div className="mt-6">
          <Button to="/register" size="lg">{t('ctaBlock.button')}</Button>
        </div>
      </section>
    </Reveal>
  )
}
