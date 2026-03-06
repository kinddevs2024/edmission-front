import { Bot, Compass, Lightbulb, Sparkles, WandSparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { TiltCard } from '@/components/ui/TiltCard'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

export function AIAssistantSection() {
  const { t } = useTranslation('landing')
  const AI_FEATURES = [
    { icon: Sparkles, text: t('ai.features.0') },
    { icon: Lightbulb, text: t('ai.features.1') },
    { icon: Compass, text: t('ai.features.2') },
    { icon: WandSparkles, text: t('ai.features.3') },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <Reveal>
          <SectionHeading
            eyebrow={t('ai.eyebrow')}
            title={t('ai.title')}
            description={t('ai.description')}
          />
          <ul className="mt-6 space-y-3">
            {AI_FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                <span className="rounded-md bg-primary-accent/15 p-1.5 text-primary-accent">
                  <feature.icon className="h-4 w-4" aria-hidden />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <TiltCard maxTilt={14} perspective={600} className="[transform-style:preserve-3d]">
            <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
              <Card className="p-5" interactive>
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
                <span className="rounded-md bg-primary-accent/15 p-2 text-primary-accent"><Bot className="h-4 w-4" aria-hidden /></span>
                <div>
                  <p className="text-sm font-semibold">{t('ai.chatTitle')}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t('ai.chatSubtitle')}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="w-[85%] rounded-input bg-[var(--color-bg)] p-3 text-[var(--color-text-muted)]">
                  {t('ai.chatQ1')}
                </div>
                <div className="ml-auto w-[82%] rounded-input bg-primary-accent/15 p-3 text-[var(--color-text)]">
                  {t('ai.chatA1')}
                </div>
                <div className="w-[70%] rounded-input bg-[var(--color-bg)] p-3 text-[var(--color-text-muted)]">
                  {t('ai.chatQ2')}
                </div>
              </div>
              </Card>
            </motion.div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  )
}
