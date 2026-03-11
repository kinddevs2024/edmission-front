import { useTranslation } from 'react-i18next'
import { Quote } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function TestimonialsSection() {
  const { t } = useTranslation('landing')

  const testimonials = [
    { quote: t('testimonials.item1.quote'), author: t('testimonials.item1.author') },
    { quote: t('testimonials.item2.quote'), author: t('testimonials.item2.author') },
    { quote: t('testimonials.item3.quote'), author: t('testimonials.item3.author') },
  ]

  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6 md:py-20 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow={t('testimonials.eyebrow')}
          title={t('testimonials.title')}
          description={t('testimonials.description')}
          align="center"
        />
      </Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <Reveal key={index} delay={index * 0.08}>
            <div className="flex h-full flex-col rounded-card border border-[var(--color-border)] bg-[var(--color-card)]/60 p-6 shadow-[var(--shadow-card)]">
              <Quote className="h-8 w-8 text-primary-accent/60" aria-hidden />
              <p className="mt-3 flex-1 text-base leading-relaxed text-[var(--color-text)]">
                &ldquo;{item.quote}&rdquo;
              </p>
              <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">
                — {item.author}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
