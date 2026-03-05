import { motion } from 'framer-motion'
import { ClipboardList, LayoutDashboard, Search, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

export function WalkthroughSection() {
  const { t } = useTranslation('landing')
  const SCREENS = [
    { title: t('walkthrough.cards.0.title'), subtitle: t('walkthrough.cards.0.desc'), icon: LayoutDashboard },
    { title: t('walkthrough.cards.1.title'), subtitle: t('walkthrough.cards.1.desc'), icon: Search },
    { title: t('walkthrough.cards.2.title'), subtitle: t('walkthrough.cards.2.desc'), icon: ClipboardList },
    { title: t('walkthrough.cards.3.title'), subtitle: t('walkthrough.cards.3.desc'), icon: Wallet },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow={t('walkthrough.eyebrow')}
          title={t('walkthrough.title')}
          description={t('walkthrough.description')}
        />
      </Reveal>

      <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {SCREENS.map((screen, index) => (
          <Reveal key={screen.title} delay={index * 0.07} className="w-full min-w-[280px] snap-start md:min-w-[340px]">
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="h-full p-6" interactive tilt>
                <div className="mb-4 inline-flex rounded-lg bg-primary-accent/15 p-2 text-primary-accent">
                  <screen.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-xl font-semibold">{screen.title}</h3>
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">{screen.subtitle}</p>
                <div className="mt-6 h-36 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                  <div className="space-y-2">
                    <div className="h-2 rounded bg-[var(--color-border)]" />
                    <div className="h-2 w-4/5 rounded bg-[var(--color-border)]" />
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="h-16 rounded bg-primary-accent/10" />
                      <div className="h-16 rounded bg-[var(--color-border)]" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
