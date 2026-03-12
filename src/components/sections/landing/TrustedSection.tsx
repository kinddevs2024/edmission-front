import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const PARTNER_LOGOS = [
  { src: '/landing/geneva-logo.svg', alt: 'Geneva School of Diplomacy & International Relations' },
  { src: '/landing/Group-78.png', alt: 'BME XPLORE / Budapest University of Technology and Economics' },
  { src: '/landing/image copy 2.png', alt: 'IU International University of Applied Sciences' },
  { src: '/landing/image copy 3.png', alt: 'Peking University HSBC Business School' },
  { src: '/landing/image copy 4.png', alt: 'UBI Business School' },
  { src: '/landing/image copy 5.png', alt: 'Kyoto University of Advanced Science' },
  { src: '/landing/image copy 6.png', alt: 'ICN Creative Business School' },
  { src: '/landing/image copy 7.png', alt: 'University of Wollongong in Dubai' },
  { src: '/landing/image copy.png', alt: 'Partner University' },
  { src: '/landing/image.png', alt: 'Partner University' },
  { src: '/landing/logo_www_2.png', alt: 'Partner University' },
  { src: '/landing/logo.png', alt: 'Partner University' },
  { src: '/landing/logo.svg', alt: 'Partner University' },
  { src: '/landing/neoma_logo.svg', alt: 'NEOMA Business School' },
  { src: '/landing/ubi-business-school.webp', alt: 'UBI Business School' },
]

export function TrustedSection() {
  const { t } = useTranslation('landing')

  const stats = [
    { value: t('trusted.statUniversities'), label: t('trusted.statUniversitiesLabel') },
    { value: t('trusted.statStudents'), label: t('trusted.statStudentsLabel') },
    { value: t('trusted.statScholarships'), label: t('trusted.statScholarshipsLabel') },
  ]

  return (
    <section id="trusted-by" className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-6 md:py-20 lg:px-8">
      <Reveal>
        <SectionHeading
          align="center"
          title={t('trusted.title')}
        />
      </Reveal>

      {/* Partner university logos carousel (aylanib turishi) */}
      <div className="relative mt-8 overflow-hidden" aria-label={t('trusted.title')}>
        <div className="flex w-max trusted-logos-marquee gap-10 px-2 pb-2">
          {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
            <div
              key={i}
              className="flex h-12 w-32 flex-shrink-0 items-center justify-center grayscale opacity-80 transition hover:grayscale-0 hover:opacity-100 sm:h-14 sm:w-40"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="max-h-full w-full object-contain object-center"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

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
