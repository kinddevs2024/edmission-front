import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { useState } from 'react'
import { clsx } from 'clsx'

export function FAQSection() {
  const { t } = useTranslation('landing')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const items = t('faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <section id="faq" className="border-y border-[var(--color-border)] bg-[var(--color-card)]/35">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-3xl px-4 py-20 md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            title={t('faq.title')}
          />
        </Reveal>
        <div className="mt-10 space-y-2">
          {items.map((item, index) => (
            <Reveal key={index} delay={index * 0.03}>
              <div
                className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]/50"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown
                    className={clsx('h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform', openIndex === index && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                <div
                  className={clsx(
                    'overflow-hidden transition-all duration-200',
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <p className="border-t border-[var(--color-border)] px-5 py-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {item.a}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
