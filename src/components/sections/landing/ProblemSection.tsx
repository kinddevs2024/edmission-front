import { AlertTriangle, BadgeDollarSign, EyeOff, Filter, Layers3, SearchX } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const STUDENT_PAIN = [
  { icon: BadgeDollarSign, text: 'Expensive admission agencies' },
  { icon: EyeOff, text: 'Hidden commissions' },
  { icon: AlertTriangle, text: 'Limited transparency' },
  { icon: SearchX, text: 'Restricted access to universities' },
]

const UNIVERSITY_PAIN = [
  { icon: BadgeDollarSign, text: 'High marketing costs' },
  { icon: Filter, text: 'Low-quality leads' },
  { icon: Layers3, text: 'No structured recruitment pipeline' },
  { icon: SearchX, text: 'Limited student discovery' },
]

function PainCard({ title, items }: { title: string; items: typeof STUDENT_PAIN }) {
  return (
    <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-[var(--color-text-muted)]">
            <span className="mt-0.5 rounded-md bg-primary-accent/10 p-1.5 text-primary-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProblemSection() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/35">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Problem Statement"
            align="center"
            title="The Admission System Is Broken"
            description="Students and universities are both affected by opaque processes and inefficient intermediaries."
          />
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal delay={0.05}><PainCard title="Students face" items={STUDENT_PAIN} /></Reveal>
          <Reveal delay={0.1}><PainCard title="Universities face" items={UNIVERSITY_PAIN} /></Reveal>
        </div>
      </div>
    </section>
  )
}
