import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const CERTIFICATION_FILES = [
  { src: '/landing/Certifications/IMG_8816.PNG', type: 'image' as const },
  { src: '/landing/Certifications/IMG_8817.PNG', type: 'image' as const },
  { src: '/landing/Certifications/IMG_8820.JPG', type: 'image' as const },
  { src: '/landing/Certifications/IMG_8822.PNG', type: 'image' as const },
  { src: '/landing/Certifications/IMG_8824.PNG', type: 'image' as const },
  { src: '/landing/Certifications/IMG_8825.PNG', type: 'image' as const },
  { src: '/landing/Certifications/IMG_8826.PNG', type: 'image' as const },
  { src: '/landing/Certifications/5330309926691655801_121.jpg', type: 'image' as const },
  { src: '/landing/Certifications/KUAS.pdf', type: 'pdf' as const, label: 'KUAS' },
]

export function CertificationsSection() {
  const { t } = useTranslation('landing')

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
        {CERTIFICATION_FILES.map((file, index) => (
          <Reveal key={file.src} delay={Math.min(index * 0.05, 0.4)}>
            {file.type === 'pdf' ? (
              <a
                href={file.src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] transition hover:border-primary-accent/50 hover:shadow-[var(--shadow-card-hover)]"
              >
                <FileText className="h-12 w-12 text-primary-accent" aria-hidden />
                <span className="mt-2 text-sm font-medium text-[var(--color-text)]">
                  {file.label ?? 'PDF'}
                </span>
                <span className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {t('certifications.viewPdf')}
                </span>
              </a>
            ) : (
              <a
                href={file.src}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] transition hover:border-primary-accent/50 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="aspect-[3/4] overflow-hidden bg-[var(--color-border)]/30">
                  <img
                    src={file.src}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </a>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  )
}
