import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Quote } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function TrustedSection() {
  const { t } = useTranslation('landing')

  const stats = [
    { value: t('trusted.statUniversities'), label: t('trusted.statUniversitiesLabel') },
    { value: t('trusted.statStudents'), label: t('trusted.statStudentsLabel') },
    { value: t('trusted.statScholarships'), label: t('trusted.statScholarshipsLabel') },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          align="center"
          title={t('trusted.title')}
        />
      </Reveal>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 0.05}>
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-[var(--shadow-card)]"
            >
              <p className="text-3xl font-bold text-primary-accent md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">{stat.label}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15}>
        <div className="mx-auto mt-12 max-w-2xl rounded-card border border-[var(--color-border)] bg-[var(--color-card)]/60 p-6 shadow-[var(--shadow-card)]">
          <Quote className="h-8 w-8 text-primary-accent/60" aria-hidden />
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text)]">
            &ldquo;{t('trusted.testimonial')}&rdquo;
          </p>
          <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">
            — {t('trusted.testimonialAuthor')}
          </p>
        </div>
      </Reveal>
    </section>
  )
}
