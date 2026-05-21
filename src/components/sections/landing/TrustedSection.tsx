import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getTrustedUniversityLogoPage } from '@/services/public'
import { getImageUrl } from '@/services/upload'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { STATIC_TRUSTED_LOGOS } from './landingAssets'

const TRUSTED_LOGOS_PAGE_SIZE = 24

export function TrustedSection() {
  const { t } = useTranslation('landing')
  const logosQuery = useInfiniteQuery({
    queryKey: ['trustedUniversityLogos', 'landing', TRUSTED_LOGOS_PAGE_SIZE],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getTrustedUniversityLogoPage({
        limit: TRUSTED_LOGOS_PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 5 * 60 * 1000,
  })
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = logosQuery

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const timer = window.setTimeout(() => {
      void fetchNextPage()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const logos = useMemo(() => {
    const pages = logosQuery.data?.pages ?? []
    const seen = new Set<string>()
    const apiLogos = pages.flatMap((page) =>
      page.items.filter((logo) => {
        const key = `${logo.id}:${logo.logoUrl}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    )
    const staticLogos = STATIC_TRUSTED_LOGOS.filter((logo) => {
      const key = `${logo.id}:${logo.logoUrl}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return [...apiLogos, ...staticLogos]
  }, [logosQuery.data?.pages])

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

      {/* Partner university logos carousel — logos from verified universities (API). */}
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
                  src={logo.logoUrl.startsWith('/') ? logo.logoUrl : getImageUrl(logo.logoUrl)}
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
