import { Bot, Compass, Lightbulb, Sparkles, WandSparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

const AI_FEATURES = [
  { icon: Sparkles, text: 'Personalized recommendations' },
  { icon: Lightbulb, text: 'Admission insights' },
  { icon: Compass, text: 'Application guidance' },
  { icon: WandSparkles, text: 'Scholarship suggestions' },
]

export function AIAssistantSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <Reveal>
          <SectionHeading
            eyebrow="AI Assistant"
            title="AI Admission Guidance"
            description="An embedded assistant helps students and universities make informed admission decisions with contextual insights."
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
          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <Card className="p-5" interactive>
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
                <span className="rounded-md bg-primary-accent/15 p-2 text-primary-accent"><Bot className="h-4 w-4" aria-hidden /></span>
                <div>
                  <p className="text-sm font-semibold">AI Admission Copilot</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Context-aware guidance</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="w-[85%] rounded-input bg-[var(--color-bg)] p-3 text-[var(--color-text-muted)]">
                  Suggest universities with scholarship potential above 60%.
                </div>
                <div className="ml-auto w-[82%] rounded-input bg-primary-accent/15 p-3 text-[var(--color-text)]">
                  Based on GPA, language, and budget, 6 strong options are available. Would you like a comparison table?
                </div>
                <div className="w-[70%] rounded-input bg-[var(--color-bg)] p-3 text-[var(--color-text-muted)]">
                  Show top 3 with deadlines.
                </div>
              </div>
            </Card>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}
