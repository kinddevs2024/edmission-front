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
        className="absolute inset-0 h-screen w-full object-cover object-[center_90%] sm:object-bottom"
        {...{ fetchpriority: 'high' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,18,38,0.82)_0%,rgba(35,78,150,0.55)_38%,rgba(255,255,255,0.08)_100%)] sm:bg-[linear-gradient(90deg,rgba(9,18,38,0.72)_0%,rgba(35,78,150,0.38)_42%,rgba(255,255,255,0.06)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,var(--color-bg)_0%,rgba(255,255,255,0)_100%)] sm:h-40" />

      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-end px-4 pb-10 pt-16 sm:items-end sm:pb-16 sm:pt-20 md:px-6 lg:px-8">
        <Reveal>
          <div className="w-full max-w-2xl pb-2 text-white drop-shadow-[0_16px_36px_rgba(15,23,42,0.45)] sm:pb-4">
            <p className="inline-flex rounded-full border border-white/40 bg-white/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-md sm:text-xs">
              {t('hero.eyebrow')}
            </p>
            <h1 className="mt-4 text-[2rem] font-semibold leading-[1.1] sm:mt-5 sm:text-5xl md:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-3 text-base font-semibold text-white sm:mt-4 sm:text-lg md:text-xl">
              {t('hero.valueLine')}
            </p>
            <p className="mt-2 max-w-xl text-sm text-white/86 sm:mt-3 sm:text-base md:text-lg">
              {t('hero.description')}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
              <Button to="/register" size="lg" className="w-full sm:w-auto">
                {t('hero.primaryCta')}
              </Button>
              <Button to="/register?role=university" variant="secondary" size="lg" className="w-full sm:w-auto">
                {t('hero.secondaryCta')}
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
