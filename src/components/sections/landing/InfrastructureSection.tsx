import { ArrowLeftRight, Database, GraduationCap, GitBranch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card, CardTitle } from '@/components/ui/Card'

export function InfrastructureSection() {
  const { t } = useTranslation('landing')
  const CAPABILITIES = [
    { title: t('infrastructure.cards.0.title'), desc: t('infrastructure.cards.0.desc'), icon: ArrowLeftRight },
    { title: t('infrastructure.cards.1.title'), desc: t('infrastructure.cards.1.desc'), icon: Database },
    { title: t('infrastructure.cards.2.title'), desc: t('infrastructure.cards.2.desc'), icon: GraduationCap },
    { title: t('infrastructure.cards.3.title'), desc: t('infrastructure.cards.3.desc'), icon: GitBranch },
  ]
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow={t('infrastructure.eyebrow')}
          align="center"
          title={t('infrastructure.title')}
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
