import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const TRUSTED_LOGOS = [
  'Northbridge University',
  'Central Tech Institute',
  'Astra Medical College',
  'European Business Academy',
  'Metropolitan Polytechnic',
  'International Liberal Arts',
]

export function TrustedSection() {
  const { t } = useTranslation('landing')
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Trust Layer"
          align="center"
          title={t('trusted.title')}
        />
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRUSTED_LOGOS.map((name, index) => (
          <Reveal key={name} delay={index * 0.04}>
            <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
              <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 text-center text-sm font-medium text-[var(--color-text-muted)] shadow-[var(--shadow-card)]">
                {name}
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
