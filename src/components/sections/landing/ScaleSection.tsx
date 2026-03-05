import { Reveal } from './Reveal'
import { useTranslation } from 'react-i18next'

export function ScaleSection() {
  const { t } = useTranslation('landing')
  const STATS = [
    { value: '50+', label: t('scale.universities') },
    { value: '10,000+', label: t('scale.students') },
    { value: '$5M', label: t('scale.scholarships') },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold text-[var(--color-text)] md:text-4xl">{t('scale.title')}</h2>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {STATS.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 0.06}>
            <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-[var(--shadow-card)]">
              <p className="text-4xl font-semibold text-[var(--color-text)] md:text-5xl">{stat.value}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
