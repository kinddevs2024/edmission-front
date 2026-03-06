import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TiltCard } from '@/components/ui/TiltCard'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

const TOTAL_SCORE = 86

export function MatchingEngineSection() {
  const { t } = useTranslation('landing')
  const FACTORS = [
    { label: t('matching.factors.0'), value: 95 },
    { label: t('matching.factors.1'), value: 88 },
    { label: t('matching.factors.2'), value: 84 },
    { label: t('matching.factors.3'), value: 80 },
    { label: t('matching.factors.4'), value: 78 },
    { label: t('matching.factors.5'), value: 74 },
  ]
  const [hovered, setHovered] = useState(false)

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('matching.eyebrow')}
            title={t('matching.title')}
            description={t('matching.description')}
          />
          <ul className="mt-6 space-y-2 text-sm text-[var(--color-text-muted)]">
            {FACTORS.map((factor) => (
              <li key={factor.label}>- {factor.label}</li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <TiltCard maxTilt={14} perspective={600} className="[transform-style:preserve-3d]">
            <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
              <Card className="relative p-8" interactive>
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border-8 border-primary-accent/20">
              <motion.div
                animate={{ scale: hovered ? 1.03 : 1 }}
                className="flex h-36 w-36 items-center justify-center rounded-full bg-primary-accent/15 text-center"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('matching.scoreLabel')}</p>
                  <p className="text-4xl font-semibold text-[var(--color-text)]">{TOTAL_SCORE}%</p>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={false}
              animate={{ opacity: hovered ? 1 : 0.9, y: hovered ? 0 : 6 }}
              className="mt-6 space-y-2"
            >
              {FACTORS.map((factor) => (
                <div key={factor.label}>
                  <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{factor.label}</span>
                    <span>{factor.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-border)]">
                    <motion.div
                      className="h-full rounded-full bg-primary-accent"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${factor.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
              </Card>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  )
}
