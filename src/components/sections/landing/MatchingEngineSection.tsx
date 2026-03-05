import { motion } from 'framer-motion'
import { useState } from 'react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

const FACTORS = [
  { label: 'GPA compatibility', value: 95 },
  { label: 'Field of study match', value: 88 },
  { label: 'Language requirements', value: 84 },
  { label: 'Scholarship eligibility', value: 80 },
  { label: 'Tuition compatibility', value: 78 },
  { label: 'Location preference', value: 74 },
]

const TOTAL_SCORE = 86

export function MatchingEngineSection() {
  const [hovered, setHovered] = useState(false)

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="AI Matching Engine"
            title="Transparent Matching Technology"
            description="Match score is calculated using deterministic factors and shown as a transparent breakdown for both sides."
          />
          <ul className="mt-6 space-y-2 text-sm text-[var(--color-text-muted)]">
            {FACTORS.map((factor) => (
              <li key={factor.label}>- {factor.label}</li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <Card className="relative p-8" interactive>
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border-8 border-primary-accent/20">
              <motion.div
                animate={{ scale: hovered ? 1.03 : 1 }}
                className="flex h-36 w-36 items-center justify-center rounded-full bg-primary-accent/15 text-center"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Match score</p>
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
        </Reveal>
      </div>
    </section>
  )
}
