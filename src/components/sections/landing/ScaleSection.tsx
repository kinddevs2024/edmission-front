import { useTranslation } from 'react-i18next'
import { TiltCard } from '@/components/ui/TiltCard'
import { CountingNumber, KerningText } from '@/components/ui/TextMotion'
import { Reveal } from './Reveal'

export function ScaleSection() {
  const { t } = useTranslation('landing')

  const stats = [
    { value: t('trusted.statUniversities'), label: t('scale.universities') },
    { value: t('trusted.statStudents'), label: t('scale.students') },
    { value: t('trusted.statScholarships'), label: t('scale.scholarships') },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold text-[var(--color-text)] md:text-4xl">
          <KerningText text={t('scale.title')} />
        </h2>
      </Reveal>
      <TiltCard maxTilt={14} perspective={600} className="mt-10 [transform-style:preserve-3d]">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.06}>
              <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-[var(--shadow-card)]">
                <p className="text-4xl font-semibold text-[var(--color-text)] md:text-5xl">
                  <CountingNumber value={stat.value} />
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </TiltCard>
    </section>
  )
}
