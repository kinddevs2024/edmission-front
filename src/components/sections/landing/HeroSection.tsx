import { motion } from 'framer-motion'
import { Building2, GraduationCap, Sparkles, ShieldCheck, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from './Reveal'

function FloatingPanel({
  className,
  title,
  value,
  icon: Icon,
}: {
  className: string
  title: string
  value: string
  icon: typeof Sparkles
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Card className="px-4 py-3" interactive>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-primary-accent/15 p-2 text-primary-accent">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">{title}</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">{value}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function HeroSection() {
  const { t } = useTranslation('landing')
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1280 760" fill="none">
          <path d="M0 130C210 40 320 40 620 160C830 245 970 240 1280 110" stroke="currentColor" className="text-[var(--color-border)]" />
          <path d="M0 310C190 220 380 220 620 310C860 400 1030 390 1280 320" stroke="currentColor" className="text-[var(--color-border)]" />
          <path d="M0 510C240 430 390 430 620 510C830 585 1010 590 1280 520" stroke="currentColor" className="text-[var(--color-border)]" />
        </svg>
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:px-6 lg:px-8">
        <Reveal>
          <p className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t('hero.eyebrow')}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-[var(--color-text)] md:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            {t('hero.subtitle')}
          </p>
          <p className="mt-6 max-w-xl text-base text-[var(--color-text-muted)]">
            {t('hero.description')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/register" size="lg">{t('hero.exploreBtn')}</Button>
            <Button to="/register?role=university" variant="secondary" size="lg">{t('hero.registerUniversityBtn')}</Button>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative mx-auto h-[420px] w-full max-w-[560px]">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-x-10 top-14"
            >
              <Card className="p-5" interactive tilt>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">{t('hero.preview.discovery')}</p>
                    <p className="mt-1 text-lg font-semibold">Global Engineering Institute</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Berlin, Germany</p>
                  </div>
                  <span className="rounded-full bg-primary-accent/15 px-3 py-1 text-sm font-semibold text-primary-accent">{t('hero.preview.match')}</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-input border border-[var(--color-border)] p-2"><p className="text-xs text-[var(--color-text-muted)]">{t('hero.preview.students')}</p><p className="font-semibold">12k+</p></div>
                  <div className="rounded-input border border-[var(--color-border)] p-2"><p className="text-xs text-[var(--color-text-muted)]">{t('hero.preview.programs')}</p><p className="font-semibold">48</p></div>
                  <div className="rounded-input border border-[var(--color-border)] p-2"><p className="text-xs text-[var(--color-text-muted)]">{t('hero.preview.scholarship')}</p><p className="font-semibold">70%</p></div>
                </div>
              </Card>
            </motion.div>

            <FloatingPanel className="absolute left-0 top-0 w-56" title={t('hero.panels.studentProfile.title')} value={t('hero.panels.studentProfile.value')} icon={GraduationCap} />
            <FloatingPanel className="absolute right-0 top-8 w-52" title={t('hero.panels.scholarship.title')} value={t('hero.panels.scholarship.value')} icon={ShieldCheck} />
            <FloatingPanel className="absolute left-8 bottom-8 w-52" title={t('hero.panels.match.title')} value={t('hero.panels.match.value')} icon={Target} />
            <FloatingPanel className="absolute right-6 bottom-2 w-56" title={t('hero.panels.university.title')} value={t('hero.panels.university.value')} icon={Building2} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
