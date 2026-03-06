import { BarChart3, Filter, GitBranch, SearchCode, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

export function UniversityExperienceSection() {
  const { t } = useTranslation('landing')
  const FEATURES = [
    { icon: SearchCode, text: t('university.features.0') },
    { icon: Filter, text: t('university.features.1') },
    { icon: GitBranch, text: t('university.features.2') },
    { icon: Users, text: t('university.features.3') },
    { icon: BarChart3, text: t('university.features.4') },
  ]
  return (
    <section id="for-universities" className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <Reveal>
          <Card className="p-5" interactive tilt>
            <p className="text-sm text-[var(--color-text-muted)]">{t('university.previewTitle')}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-input border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">{t('university.metrics.interested')}</p><p className="text-xl font-semibold">142</p></div>
              <div className="rounded-input border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">{t('university.metrics.offersSent')}</p><p className="text-xl font-semibold">36</p></div>
              <div className="rounded-input border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">{t('university.metrics.acceptanceRate')}</p><p className="text-xl font-semibold">28%</p></div>
              <div className="rounded-input border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">{t('university.metrics.activeChats')}</p><p className="text-xl font-semibold">51</p></div>
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
            eyebrow={t('university.eyebrow')}
            title={t('university.title')}
            description={t('university.description')}
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
