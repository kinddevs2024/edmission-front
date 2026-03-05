import { BarChart3, Filter, GitBranch, SearchCode, Users } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

const FEATURES = [
  { icon: SearchCode, text: 'Discover students' },
  { icon: Filter, text: 'Filter candidates' },
  { icon: GitBranch, text: 'Manage admission pipeline' },
  { icon: Users, text: 'Allocate scholarships' },
  { icon: BarChart3, text: 'View analytics' },
]

export function UniversityExperienceSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <Reveal>
          <Card className="p-5" interactive tilt>
            <p className="text-sm text-[var(--color-text-muted)]">University dashboard preview</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-input border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">Interested</p><p className="text-xl font-semibold">142</p></div>
              <div className="rounded-input border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">Offers sent</p><p className="text-xl font-semibold">36</p></div>
              <div className="rounded-input border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">Acceptance rate</p><p className="text-xl font-semibold">28%</p></div>
              <div className="rounded-input border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">Active chats</p><p className="text-xl font-semibold">51</p></div>
            </div>
            <div className="mt-3 rounded-input border border-[var(--color-border)] p-3">
              <div className="h-2 w-full rounded bg-[var(--color-border)]" />
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="h-16 rounded bg-primary-accent/15" />
                <div className="h-16 rounded bg-[var(--color-border)]" />
                <div className="h-16 rounded bg-[var(--color-border)]" />
                <div className="h-16 rounded bg-[var(--color-border)]" />
              </div>
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <SectionHeading
            eyebrow="University Experience"
            title="Built for Universities"
            description="Operational tooling for structured student acquisition, communication, and scholarship governance."
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
      </div>
    </section>
  )
}
