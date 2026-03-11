import { lazy, Suspense } from 'react'
import { HeroSection } from '@/components/sections/landing/HeroSection'
import { TrustedSection } from '@/components/sections/landing/TrustedSection'
import { AccreditationSection } from '@/components/sections/landing/AccreditationSection'
import { CertificationsSection } from '@/components/sections/landing/CertificationsSection'
import { TestimonialsSection } from '@/components/sections/landing/TestimonialsSection'
import { ProblemSection } from '@/components/sections/landing/ProblemSection'
import { CtaBlock } from '@/components/sections/landing/CtaBlock'
import { InfrastructureSection } from '@/components/sections/landing/InfrastructureSection'
import { FAQSection } from '@/components/sections/landing/FAQSection'
import { FinalCtaSection } from '@/components/sections/landing/FinalCtaSection'
import { FooterSection } from '@/components/sections/landing/FooterSection'
import { LandingHeader } from '@/components/sections/landing/LandingHeader'

const LandingBelowFold = lazy(() =>
  import('@/components/sections/landing/LandingBelowFold').then((m) => ({ default: m.LandingBelowFold }))
)

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] safe-area-pb">
      <LandingHeader />
      <HeroSection />
      <TrustedSection />
      <AccreditationSection />
      <CertificationsSection />
      <TestimonialsSection />
      <ProblemSection />
      <CtaBlock />
      <InfrastructureSection />
      <Suspense fallback={<div className="min-h-[50vh] w-full" />}>
        <LandingBelowFold />
      </Suspense>
      <FAQSection />
      <FinalCtaSection />
      <FooterSection />
    </main>
  )
}
