import { motion } from 'framer-motion'
import { ClipboardList, LayoutDashboard, Search, Wallet } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

const SCREENS = [
  {
    title: 'Student dashboard',
    subtitle: 'Profile completion, recommendations, active applications.',
    icon: LayoutDashboard,
  },
  {
    title: 'University discovery',
    subtitle: 'Filter-ready university feed with transparent match insights.',
    icon: Search,
  },
  {
    title: 'Application tracking',
    subtitle: 'Live statuses from interested to accepted.',
    icon: ClipboardList,
  },
  {
    title: 'Offer management',
    subtitle: 'Scholarship offer flow with deadline and response controls.',
    icon: Wallet,
  },
]

export function WalkthroughSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Platform Walkthrough"
          title="Core workflows in one integrated experience"
          description="Horizontally explore key product surfaces designed for modern admission operations."
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
