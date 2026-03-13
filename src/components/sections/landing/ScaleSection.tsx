import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TiltCard } from '@/components/ui/TiltCard'
import { getPublicStats } from '@/services/public'
import { Reveal } from './Reveal'

function formatStat(value: number, suffix?: string): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M${suffix ?? ''}`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K${suffix ?? ''}`
  return `${value.toLocaleString()}${suffix ?? ''}`
}

export function ScaleSection() {
  const { t } = useTranslation('landing')
  const [statsData, setStatsData] = useState<{ universities: number; students: number; scholarships: number } | null>(null)

  useEffect(() => {
    getPublicStats()
      .then(setStatsData)
      .catch(() => {})
  }, [])

  const STATS = [
    { value: statsData != null ? formatStat(statsData.universities, '+') : '—', label: t('scale.universities') },
    { value: statsData != null ? formatStat(statsData.students, '+') : '—', label: t('scale.students') },
    { value: statsData != null ? `$${formatStat(statsData.scholarships)}` : '—', label: t('scale.scholarships') },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold text-[var(--color-text)] md:text-4xl">{t('scale.title')}</h2>
      </Reveal>
      <TiltCard maxTilt={14} perspective={600} className="mt-10 [transform-style:preserve-3d]">
        <div className="grid gap-4 sm:grid-cols-3">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.06}>
              <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-[var(--shadow-card)]">
                <p className="text-4xl font-semibold text-[var(--color-text)] md:text-5xl">{stat.value}</p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </TiltCard>
    </section>
  )
}
