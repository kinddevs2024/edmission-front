import { BadgePercent, CalendarClock, CircleDollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TiltCard } from '@/components/ui/TiltCard'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

const SCHOLARSHIPS = [
  { name: 'Merit Scholarship', coverage: 75, slots: '18 slots left', deadline: 'May 30' },
  { name: 'STEM Excellence Grant', coverage: 60, slots: '12 slots left', deadline: 'Jun 10' },
  { name: 'Global Talent Award', coverage: 50, slots: '24 slots left', deadline: 'Jun 28' },
]

export function ScholarshipSection() {
  const { t } = useTranslation('landing')
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/45">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('scholarship.eyebrow')}
            align="center"
            title={t('scholarship.title')}
            description={t('scholarship.description')}
          />
        </Reveal>
        <TiltCard maxTilt={14} perspective={600} className="mt-10 [transform-style:preserve-3d]">
          <div className="grid gap-4 md:grid-cols-3">
            {SCHOLARSHIPS.map((item, index) => (
              <Reveal key={item.name} delay={index * 0.06}>
                <Card className="h-full p-5" interactive>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{item.name}</h3>
                  <BadgePercent className="h-4 w-4 text-primary-accent" aria-hidden />
                </div>
                <p className="mt-4 text-3xl font-semibold">{item.coverage}%</p>
                <div className="mt-2 h-2 rounded-full bg-[var(--color-border)]">
                  <div className="h-full rounded-full bg-primary-accent" style={{ width: `${item.coverage}%` }} />
                </div>
                <div className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
                  <p className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4" aria-hidden />{item.slots}</p>
                  <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" aria-hidden />{t('scholarship.deadline')}: {item.deadline}</p>
                </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </TiltCard>
      </div>
    </section>
  )
}
