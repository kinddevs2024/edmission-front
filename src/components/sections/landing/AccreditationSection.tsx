import { useTranslation } from 'react-i18next'
import { Award, Shield, CheckCircle2 } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function AccreditationSection() {
  const { t } = useTranslation('landing')

  const items = [
    { icon: Award, key: 'quality' },
    { icon: Shield, key: 'trust' },
    { icon: CheckCircle2, key: 'standards' },
  ] as const

  return (
    <section id="about-us" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:py-16 md:px-6 md:py-20 lg:scroll-mt-28 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow={t('accreditation.eyebrow')}
          title={t('accreditation.title')}
          description={t('accreditation.description')}
          align="center"
        />
      </Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {items.map(({ icon: Icon, key }, index) => (
          <Reveal key={key} delay={index * 0.08}>
            <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-[var(--shadow-card)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-accent/15 text-primary-accent">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-[var(--color-text)]">
                {t(`accreditation.${key}Title`)}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t(`accreditation.${key}Desc`)}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
