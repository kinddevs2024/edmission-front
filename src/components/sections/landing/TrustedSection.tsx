import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

type TrustedUniversityLogo = {
  id: string
  name: string
  logoUrl: string
}

const TRUSTED_UNIVERSITY_LOGOS: TrustedUniversityLogo[] = [
  { id: 'geneva', name: 'Geneva Business School', logoUrl: '/landing/geneva-logo.svg' },
  { id: 'neoma', name: 'NEOMA Business School', logoUrl: '/landing/neoma_logo.svg' },
  { id: 'ubi', name: 'UBI Business School', logoUrl: '/landing/ubi-business-school.webp' },
  { id: 'logo-main', name: 'Partner University 1', logoUrl: '/landing/logo.svg' },
  { id: 'logo-png', name: 'Partner University 2', logoUrl: '/landing/logo.png' },
  { id: 'school-logo', name: 'Partner University 3', logoUrl: '/landing/logo_schools_u4a5a5402_af3d6608.jpg' },
  { id: 'www-2', name: 'Partner University 4', logoUrl: '/landing/logo_www_2.png' },
  { id: 'group-78', name: 'Partner University 5', logoUrl: '/landing/Group-78.png' },
  { id: 'images', name: 'Partner University 6', logoUrl: '/landing/images.png' },
  { id: 'images-1', name: 'Partner University 7', logoUrl: '/landing/images%20(1).png' },
  { id: 'images-2', name: 'Partner University 8', logoUrl: '/landing/images%20(2).png' },
  { id: 'copy-3', name: 'Partner University 9', logoUrl: '/landing/image%20copy%203.png' },
  { id: 'copy-4', name: 'Partner University 10', logoUrl: '/landing/image%20copy%204.png' },
  { id: 'copy-5', name: 'Partner University 11', logoUrl: '/landing/image%20copy%205.png' },
  { id: 'copy-6', name: 'Partner University 12', logoUrl: '/landing/image%20copy%206.png' },
  { id: 'copy-7', name: 'Partner University 13', logoUrl: '/landing/image%20copy%207.png' },
  { id: 'unnamed-jpg', name: 'Partner University 14', logoUrl: '/landing/unnamed.jpg' },
  { id: 'unnamed-png', name: 'Partner University 15', logoUrl: '/landing/unnamed.png' },
  { id: 'seneca', name: 'Seneca College', logoUrl: '/landing/%EC%84%B8%EB%84%A4%EC%B9%B4-%EC%BB%AC%EB%A6%AC%EC%A7%80-%EB%A1%9C%EA%B3%A0.jpg' },
]

export function TrustedSection() {
  const { t } = useTranslation('landing')
  const logos = TRUSTED_UNIVERSITY_LOGOS

  const stats = [
    {
      value: t('trusted.statUniversities'),
      label: t('trusted.statUniversitiesLabel'),
    },
    {
      value: t('trusted.statStudents'),
      label: t('trusted.statStudentsLabel'),
    },
    {
      value: t('trusted.statScholarships'),
      label: t('trusted.statScholarshipsLabel'),
    },
  ]
  const marqueeLogos = logos.length > 1 ? [...logos, ...logos] : logos

  return (
    <section id="trusted-by" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-12 pb-20 sm:pt-16 sm:pb-24 md:px-6 md:pt-20 md:pb-32 lg:scroll-mt-28 lg:px-8">
      <Reveal>
        <SectionHeading
          align="center"
          title={t('trusted.title')}
        />
      </Reveal>

      {/* Partner university logos carousel */}
      {logos.length > 0 && (
        <div
          className="relative mt-8 overflow-hidden logos-viewport"
          aria-label={t('trusted.title')}
        >
          <div className="flex w-max trusted-logos-marquee items-center gap-12 py-2">
            {marqueeLogos.map((logo, i) => (
              <div
                key={`${logo.id}-${i}`}
                className="flex h-14 w-44 shrink-0 items-center justify-center px-2 sm:h-16 sm:w-48"
              >
                <img
                  src={logo.logoUrl}
                  alt={logo.name}
                  className="max-h-12 max-w-full object-contain object-center sm:max-h-14"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-14 sm:mt-16 grid gap-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 0.05}>
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-[var(--shadow-card)]"
            >
              <p className="text-3xl font-bold text-primary-accent md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">{stat.label}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
