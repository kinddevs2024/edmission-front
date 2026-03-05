import { ArrowLeftRight, Database, GraduationCap, GitBranch } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card, CardTitle } from '@/components/ui/Card'

const CAPABILITIES = [
  {
    title: 'Direct Connection',
    desc: 'Students and universities communicate directly in a secure environment.',
    icon: ArrowLeftRight,
  },
  {
    title: 'Transparent Matching',
    desc: 'Each recommendation includes explicit factor-level score breakdown.',
    icon: Database,
  },
  {
    title: 'Scholarship Allocation',
    desc: 'Universities allocate, track, and govern scholarship slots in one workflow.',
    icon: GraduationCap,
  },
  {
    title: 'Structured Admission Pipeline',
    desc: 'Progress flows through a clear pipeline from discovery to accepted offer.',
    icon: GitBranch,
  },
]

export function InfrastructureSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Platform Infrastructure"
          align="center"
          title="A Transparent Admission Ecosystem"
        />
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CAPABILITIES.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.06}>
            <Card className="h-full" interactive tilt>
              <span className="inline-flex rounded-lg bg-primary-accent/15 p-2 text-primary-accent">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <CardTitle className="mt-4">{item.title}</CardTitle>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{item.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
