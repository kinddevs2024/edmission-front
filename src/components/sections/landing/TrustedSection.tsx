import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { getTrustedUniversityLogos, type TrustedUniversityLogo } from '@/services/public'
import { getImageUrl } from '@/services/upload'

export function TrustedSection() {
  const { t } = useTranslation('landing')
  const logosContainerRef = useRef<HTMLDivElement>(null)
  const [logos, setLogos] = useState<TrustedUniversityLogo[]>([])

  const updateLogoIntensity = useCallback(() => {
    const container = logosContainerRef.current
    if (!container || window.innerWidth < 768) return
    const items = container.querySelectorAll<HTMLElement>('.trusted-logo-item')
    const vwCenter = window.innerWidth / 2
    const falloff = window.innerWidth * 0.4
    items.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const elCenter = rect.left + rect.width / 2
      const dist = Math.abs(elCenter - vwCenter)
      const ratio = Math.max(0, 1 - dist / falloff)
      const g = Math.round((1 - ratio) * 100)
      el.style.filter = `grayscale(${g}%)`
      el.style.opacity = String(0.6 + 0.4 * ratio)
    })
  }, [])

  useEffect(() => {
    updateLogoIntensity()
    const onScroll = () => requestAnimationFrame(updateLogoIntensity)
    const onResize = () => requestAnimationFrame(updateLogoIntensity)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [updateLogoIntensity])

  useEffect(() => {
    let isMounted = true

    getTrustedUniversityLogos()
      .then((data) => {
        if (isMounted) setLogos(data)
      })
      .catch(() => {
        if (isMounted) setLogos([])
      })

    return () => {
      isMounted = false
    }
  }, [])

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
  const marqueeLogos = logos.length > 0 ? [...logos, ...logos] : []

  return (
    <section id="trusted-by" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-12 pb-20 sm:pt-16 sm:pb-24 md:px-6 md:pt-20 md:pb-32 lg:scroll-mt-28 lg:px-8">
      <Reveal>
        <SectionHeading
          align="center"
          title={t('trusted.title')}
        />
      </Reveal>

      {/* Partner university logos carousel - desktop: grayscale at edges, color in center */}
      <div
        className="relative mt-8 overflow-hidden logos-viewport"
        aria-label={t('trusted.title')}
        ref={logosContainerRef}
      >
        <div className="flex w-max trusted-logos-marquee gap-10 px-2 pb-2">
          {marqueeLogos.map((logo, i) => (
            <div
              key={`${logo.id}-${i}`}
              className="trusted-logo-item flex h-12 w-32 flex-shrink-0 items-center justify-center grayscale opacity-80 transition-[filter,opacity] duration-300 sm:h-14 sm:w-40 max-md:grayscale-0 max-md:opacity-100"
              onMouseEnter={(e) => {
                if (window.innerWidth >= 768) {
                  e.currentTarget.style.filter = 'grayscale(0%)'
                  e.currentTarget.style.opacity = '1'
                }
              }}
              onMouseLeave={() => {
                if (window.innerWidth >= 768) updateLogoIntensity()
              }}
            >
              <img
                src={getImageUrl(logo.logoUrl)}
                alt={logo.name}
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
