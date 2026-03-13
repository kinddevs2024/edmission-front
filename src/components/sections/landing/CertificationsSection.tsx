import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getLandingCertificates, type LandingCertificate } from '@/services/public'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function CertificationsSection() {
  const { t } = useTranslation('landing')
  const [items, setItems] = useState<LandingCertificate[]>([])

  useEffect(() => {
    getLandingCertificates()
      .then((list) => setItems(list.filter((c) => c.type === 'university')))
      .catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <section id="certifications" className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6 md:py-20 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow={t('certifications.eyebrow')}
          title={t('certifications.title')}
          description={t('certifications.description')}
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
              className="group flex flex-col overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] transition hover:border-primary-accent/50 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="h-52 sm:h-64 shrink-0 overflow-hidden bg-[var(--color-border)]/30">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-contain transition group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <p className="shrink-0 px-4 py-3 text-sm font-medium text-[var(--color-text)]">{item.title}</p>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
