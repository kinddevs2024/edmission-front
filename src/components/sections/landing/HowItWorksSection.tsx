import { Building2, GraduationCap, School, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

interface FlowTheme {
  icon: string
  ordinal: string
  ordinalText: string
  panel: string
  accent: string
  beam: string
  orbA: string
  orbB: string
}

interface FlowCard {
  icon: LucideIcon
  title: string
  caption: string
  steps: string[]
  theme: FlowTheme
}

function FlowColumn({
  flow,
  ordinalLabels,
  delay,
}: {
  flow: FlowCard
  ordinalLabels: string[]
  delay: number
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <Card className="group relative h-full overflow-hidden border-[var(--color-border)]/80 bg-[var(--color-card)] p-0 shadow-[var(--shadow-card)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className={`absolute inset-x-6 top-5 h-px ${flow.theme.beam}`} />
          <div className={`absolute -right-12 -top-10 h-36 w-36 rounded-full blur-3xl ${flow.theme.orbA}`} />
          <div className={`absolute left-1/2 top-20 h-24 w-24 -translate-x-1/2 rounded-full blur-2xl ${flow.theme.orbB}`} />
        </div>

        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${flow.theme.icon}`}>
              <flow.icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                {flow.caption}
              </p>
              <h3 className="mt-1 text-xl font-semibold leading-tight text-[var(--color-text)]">
                {flow.title}
              </h3>
            </div>
          </div>

          <ol className="mt-8 space-y-3">
            {flow.steps.map((step, index) => (
              <li
                key={`${flow.title}-${index}`}
                className={`relative overflow-hidden rounded-[1.5rem] border p-4 backdrop-blur-sm ${flow.theme.panel}`}
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${flow.theme.accent}`} aria-hidden />
                <div className="flex items-start gap-4">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold ${flow.theme.ordinal}`}>
                    {String(index + 1).padStart(1, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${flow.theme.ordinalText}`}>
                      {ordinalLabels[index]}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-[var(--color-text)]">
                      {step}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </Reveal>
  )
}

export function HowItWorksSection() {
  const { t } = useTranslation('landing')

  const ordinalLabels = [
    t('howItWorksSection.labels.first'),
    t('howItWorksSection.labels.second'),
    t('howItWorksSection.labels.third'),
    t('howItWorksSection.labels.fourth'),
  ]

  const flows: FlowCard[] = [
    {
      icon: GraduationCap,
      title: t('howItWorksSection.students.title'),
      caption: t('howItWorksSection.students.caption'),
      steps: [
        t('howItWorksSection.students.step1'),
        t('howItWorksSection.students.step2'),
        t('howItWorksSection.students.step3'),
        t('howItWorksSection.students.step4'),
      ],
      theme: {
        icon: 'border-primary-accent/25 bg-primary-accent/12 text-primary-accent',
        ordinal: 'border-primary-accent/20 bg-primary-accent/10 text-primary-accent',
        ordinalText: 'text-primary-accent',
        panel: 'border-primary-accent/15 bg-[linear-gradient(145deg,rgba(132,204,22,0.09),rgba(132,204,22,0.03)_45%,transparent)]',
        accent: 'bg-gradient-to-b from-primary-accent via-primary-accent/75 to-transparent',
        beam: 'bg-gradient-to-r from-transparent via-primary-accent/65 to-transparent',
        orbA: 'bg-primary-accent/18',
        orbB: 'bg-lime-300/16',
      },
    },
    {
      icon: Building2,
      title: t('howItWorksSection.universities.title'),
      caption: t('howItWorksSection.universities.caption'),
      steps: [
        t('howItWorksSection.universities.step1'),
        t('howItWorksSection.universities.step2'),
        t('howItWorksSection.universities.step3'),
      ],
      theme: {
        icon: 'border-sky-500/25 bg-sky-500/12 text-sky-600 dark:text-sky-300',
        ordinal: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300',
        ordinalText: 'text-sky-600 dark:text-sky-300',
        panel: 'border-sky-500/15 bg-[linear-gradient(145deg,rgba(14,165,233,0.12),rgba(59,130,246,0.07)_42%,rgba(99,102,241,0.03)_72%)]',
        accent: 'bg-gradient-to-b from-sky-500 via-blue-500/80 to-transparent',
        beam: 'bg-gradient-to-r from-transparent via-sky-500 to-transparent',
        orbA: 'bg-sky-500/20',
        orbB: 'bg-indigo-500/16',
      },
    },
    {
      icon: School,
      title: t('howItWorksSection.counsellors.title'),
      caption: t('howItWorksSection.counsellors.caption'),
      steps: [
        t('howItWorksSection.counsellors.step1'),
        t('howItWorksSection.counsellors.step2'),
        t('howItWorksSection.counsellors.step3'),
      ],
      theme: {
        icon: 'border-amber-400/30 bg-amber-400/12 text-amber-700 dark:text-amber-300',
        ordinal: 'border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-300',
        ordinalText: 'text-amber-700 dark:text-amber-300',
        panel: 'border-amber-400/15 bg-[linear-gradient(145deg,rgba(245,158,11,0.11),rgba(251,191,36,0.05)_48%,transparent)]',
        accent: 'bg-gradient-to-b from-amber-400 via-amber-500/75 to-transparent',
        beam: 'bg-gradient-to-r from-transparent via-amber-400/75 to-transparent',
        orbA: 'bg-amber-400/18',
        orbB: 'bg-orange-300/14',
      },
    },
  ]

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-card)]/35 scroll-mt-24 lg:scroll-mt-28"
    >
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden>
        <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-primary-accent/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('howItWorksSection.eyebrow')}
            title={t('howItWorksSection.title')}
            description={t('howItWorksSection.description')}
            align="center"
          />
        </Reveal>

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {flows.map((flow, index) => (
            <FlowColumn key={flow.title} flow={flow} ordinalLabels={ordinalLabels} delay={index * 0.06} />
          ))}
        </div>
      </div>
    </section>
  )
}
