import { MessageCircle, Sparkles, Telescope, Wallet } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

const FEATURES = [
  { icon: Telescope, text: 'Explore universities' },
  { icon: Sparkles, text: 'Receive AI recommendations' },
  { icon: MessageCircle, text: 'Chat with universities' },
  { icon: Wallet, text: 'Receive scholarship offers' },
]

export function StudentExperienceSection() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/45">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 md:grid-cols-2 md:items-center md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Student Experience"
            title="Built for Students"
            description="Every step is built for clarity, speed, and direct access to universities."
          />
          <ul className="mt-6 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                <span className="rounded-md bg-primary-accent/15 p-1.5 text-primary-accent">
                  <feature.icon className="h-4 w-4" aria-hidden />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="p-5" interactive tilt>
            <p className="text-sm text-[var(--color-text-muted)]">Student dashboard preview</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">Profile completion</p>
                <p className="mt-1 text-xl font-semibold">84%</p>
                <div className="mt-2 h-2 rounded-full bg-[var(--color-border)]">
                  <div className="h-full w-[84%] rounded-full bg-primary-accent" />
                </div>
              </div>
              <div className="rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">Active applications</p>
                <p className="mt-1 text-xl font-semibold">06</p>
              </div>
            </div>
            <div className="mt-3 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Recommended universities</p>
              <div className="mt-2 space-y-2">
                <div className="h-8 rounded bg-primary-accent/10" />
                <div className="h-8 rounded bg-[var(--color-border)]" />
                <div className="h-8 rounded bg-[var(--color-border)]" />
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
