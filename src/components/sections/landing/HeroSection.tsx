import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Reveal } from './Reveal'

export function HeroSection() {
  const { t } = useTranslation('landing')
  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden border-b border-[var(--color-border)] bg-[#dfeeff]">
      <img
        src="/preview.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-bottom"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,18,38,0.72)_0%,rgba(35,78,150,0.38)_42%,rgba(255,255,255,0.06)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,var(--color-bg)_0%,rgba(255,255,255,0)_100%)]" />

      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-end px-4 pb-12 pt-20 sm:pb-16 md:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl pb-4 text-white drop-shadow-[0_16px_36px_rgba(15,23,42,0.45)]">
            <p className="inline-flex rounded-full border border-white/40 bg-white/18 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur-md">
              {t('hero.eyebrow')}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-4 text-lg font-semibold text-white md:text-xl">
              {t('hero.valueLine')}
            </p>
            <p className="mt-3 max-w-xl text-base text-white/86 md:text-lg">
              {t('hero.description')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/register" size="lg">{t('hero.primaryCta')}</Button>
              <Button to="/register?role=university" variant="secondary" size="lg">{t('hero.secondaryCta')}</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
