import { AlertTriangle, BadgeDollarSign, EyeOff, Filter, Layers3, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

function PainCard({ title, items }: { title: string; items: Array<{ icon: typeof AlertTriangle; text: string }> }) {
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
  const { t } = useTranslation('landing')
  const STUDENT_PAIN = [
    { icon: BadgeDollarSign, text: t('problem.students.0') },
    { icon: EyeOff, text: t('problem.students.1') },
    { icon: AlertTriangle, text: t('problem.students.2') },
    { icon: SearchX, text: t('problem.students.3') },
  ]
  const UNIVERSITY_PAIN = [
    { icon: BadgeDollarSign, text: t('problem.universities.0') },
    { icon: Filter, text: t('problem.universities.1') },
    { icon: Layers3, text: t('problem.universities.2') },
    { icon: SearchX, text: t('problem.universities.3') },
  ]
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/35">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('problem.eyebrow')}
            align="center"
            title={t('problem.title')}
            description={t('problem.description')}
          />
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal delay={0.05}><PainCard title={t('problem.studentsTitle')} items={STUDENT_PAIN} /></Reveal>
          <Reveal delay={0.1}><PainCard title={t('problem.universitiesTitle')} items={UNIVERSITY_PAIN} /></Reveal>
        </div>
      </div>
    </section>
  )
}
