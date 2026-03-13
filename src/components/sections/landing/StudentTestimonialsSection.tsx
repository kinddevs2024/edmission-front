import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getLandingCertificates, type LandingCertificate } from '@/services/public'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function StudentTestimonialsSection() {
  const { t } = useTranslation('landing')
  const [items, setItems] = useState<LandingCertificate[]>([])

  useEffect(() => {
    getLandingCertificates()
      .then((list) => setItems(list.filter((c) => c.type === 'student')))
      .catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <section id="student-testimonials" className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6 md:py-20 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow={t('testimonials.eyebrow')}
          title={t('testimonials.studentSectionTitle')}
          description={t('testimonials.description')}
          align="center"
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.id} delay={Math.min(index * 0.05, 0.4)}>
            <a
              href={item.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[3/4] overflow-hidden rounded-card border border-[var(--color-border)] shadow-[var(--shadow-card)] transition hover:border-primary-accent/50 hover:shadow-[var(--shadow-card-hover)]"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <p className="absolute bottom-0 left-0 right-0 p-4 text-sm font-medium text-white drop-shadow-md">
                {item.title}
              </p>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
