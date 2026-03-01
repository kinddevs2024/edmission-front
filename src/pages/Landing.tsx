import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useInView } from '@/hooks/useInView'

const SVG_BASE = '/svg%20elements'
function svgPath(name: string) {
  return `${SVG_BASE}/${encodeURIComponent(name)}`
}

const PILLAR_KEYS = ['pillar1', 'pillar2', 'pillar3', 'pillar4', 'pillar5'] as const
const STEP_IDS = ['01', '02', '03', '04', '05', '06'] as const

function SectionInView({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`transition-all duration-700 ${inView ? 'landing-animate-in opacity-100' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  )
}

export function Landing() {
  const { t } = useTranslation(['common', 'auth', 'landing'])
  const [openStep, setOpenStep] = useState<string | null>('01')
  const pillars = PILLAR_KEYS.map((key) => ({ title: t(`landing:${key}Title`), desc: t(`landing:${key}Desc`) }))
  const processSteps = STEP_IDS.map((id, i) => ({ id, title: t(`landing:step${i + 1}Title`), body: t(`landing:step${i + 1}Body`) }))
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
    setContactName('')
    setContactEmail('')
    setContactMessage('')
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="landing-animate-in">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-4">
            {t('common:appName')}
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto mb-8">
            {t('landing:heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button to="/login" variant="primary" className="min-w-[140px]">
              {t('common:login')}
            </Button>
            <Button to="/register" variant="secondary" className="min-w-[140px]">
              {t('common:register')}
            </Button>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div className="absolute top-4 left-1/4 w-5 h-5 landing-animate-pulse opacity-80">
            <img src={svgPath('Ellipse 16.svg')} alt="" className="w-full h-full" />
          </div>
          <div className="landing-animate-rotate w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
            <img
              src={svgPath('Illustration.svg')}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute bottom-8 right-1/4 w-6 h-6 landing-animate-float opacity-80">
            <img src={svgPath('Ellipse 16.svg')} alt="" className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* Overview — опора платформы из blueprint, анимация при скролле */}
      <section className="max-w-4xl mx-auto py-16 px-4">
        <SectionInView>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8 text-center">
            {t('landing:overviewTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pillars.map((pillar, i) => (
              <div
                key={pillar.title}
                className="flex gap-3 p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary-accent)]/50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center landing-animate-float" style={{ animationDelay: `${i * 0.15}s` }}>
                  <img src={svgPath('Frame.svg')} alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text)] mb-1">{pillar.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <div className="landing-animate-rotate opacity-30 w-32 h-20">
              <img src={svgPath('Ellipse 7.svg')} alt="" className="w-full h-full object-contain" />
            </div>
          </div>
        </SectionInView>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto py-16 px-4">
        <SectionInView>
          <Card className="p-8 md:p-10 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-4">
                {t('landing:ctaTitle')}
              </h2>
              <p className="text-[var(--color-text-muted)] mb-6">
                {t('landing:ctaText')}
              </p>
              <Button to="/register" variant="primary">
                {t('landing:ctaButton')}
              </Button>
            </div>
            <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0">
              <img
                src={svgPath('Ellipse 9.svg')}
                alt=""
                className="absolute inset-0 w-full h-full object-contain landing-animate-float"
              />
              <img
                src={svgPath('Ellipse 8.svg')}
                alt=""
                className="absolute top-0 right-0 w-24 h-24 object-contain landing-animate-rotate opacity-60"
                style={{ animationDuration: '25s' }}
              />
              <img
                src={svgPath('Star 4.svg')}
                alt=""
                className="absolute bottom-0 right-0 w-12 h-12 object-contain landing-animate-pulse"
              />
            </div>
          </Card>
        </SectionInView>
      </section>

      {/* Process accordion */}
      <section className="max-w-2xl mx-auto py-16 px-4">
        <SectionInView>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8 text-center">
            {t('landing:howItWorks')}
          </h2>
          <div className="space-y-3">
            {processSteps.map((step) => {
              const isOpen = openStep === step.id
              return (
                <Card
                  key={step.id}
                  className={`rounded-2xl border overflow-hidden transition-colors ${
                    isOpen
                      ? 'bg-[var(--color-primary-accent)]/15 border-[var(--color-primary-accent)]'
                      : 'bg-[var(--color-card)] border-[var(--color-border)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenStep(isOpen ? null : step.id)}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left"
                  >
                    <span className="font-bold text-[var(--color-text)]">
                      <span className="text-lg mr-2">{step.id}</span>
                      {step.title}
                    </span>
                    <span className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-[var(--color-text)] flex items-center justify-center bg-[var(--color-secondary)]">
                      <img
                        src={isOpen ? svgPath('Property 1=Minus.svg') : svgPath('Property 1=Plus.svg')}
                        alt=""
                        className="w-5 h-5"
                      />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {step.body}
                      </p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </SectionInView>
      </section>

      {/* Contact */}
      <section className="max-w-2xl mx-auto py-16 px-4">
        <SectionInView>
          <Card className="p-6 md:p-8 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-lg bg-[var(--color-primary-accent)] text-[var(--color-primary-dark)] font-medium text-sm">
                {t('landing:contact')}
              </span>
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                {t('landing:contactTitle')}
              </h2>
            </div>
            {contactSent ? (
              <p className="text-[var(--color-text-muted)] py-4">
                {t('landing:contactThanks')}
              </p>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('landing:nameLabel')}</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t('landing:nameLabel')}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('common:email')} *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t('common:email')}
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('landing:messageLabel')} *</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={t('landing:messageLabel')}
                    required
                    rows={4}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-accent)] resize-y"
                  />
                </div>
                <div className="relative">
                  <Button type="submit" variant="primary" className="w-full md:w-auto min-w-[160px]">
                    {t('landing:sendButton')}
                  </Button>
                  <img
                    src={svgPath('Star 2.svg')}
                    alt=""
                    className="absolute -right-2 -bottom-2 w-10 h-10 object-contain opacity-40 landing-animate-float"
                  />
                </div>
              </form>
            )}
          </Card>
        </SectionInView>
      </section>
      <footer className="py-6 text-center text-sm text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
        <Link to="/privacy" className="hover:text-primary-accent hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  )
}
