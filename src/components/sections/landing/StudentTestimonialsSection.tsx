import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { STATIC_STUDENT_TESTIMONIALS } from './landingAssets'

export function StudentTestimonialsSection() {
  const { t } = useTranslation('landing')
  const visibleItems = STATIC_STUDENT_TESTIMONIALS

  return (
    <section
      id="student-testimonials"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:py-16 md:px-6 md:py-20 lg:scroll-mt-28 lg:px-8"
    >
      {visibleItems.length > 0 ? (
        <>
          <Reveal>
            <SectionHeading
              eyebrow={t('testimonials.eyebrow')}
              title={t('testimonials.studentSectionTitle')}
              description={t('testimonials.description')}
              align="center"
            />
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-3">
            {visibleItems.map((item, index) => (
              <Reveal key={item.id} delay={Math.min(index * 0.05, 0.4)}>
                <a
                  href={item.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block h-52 sm:h-64 w-full overflow-hidden rounded-card border border-[var(--color-border)] shadow-[var(--shadow-card)] transition hover:border-primary-accent/50 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                    style={{ objectPosition: item.objectPosition }}
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
        </>
      ) : null}
    </section>
  )
}
