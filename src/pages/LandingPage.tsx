import { HeroSection } from '@/components/sections/landing/HeroSection'
import { ExploreSection } from '@/components/sections/landing/ExploreSection'
import { TrustedSection } from '@/components/sections/landing/TrustedSection'
import { HowItWorksSection } from '@/components/sections/landing/HowItWorksSection'
import { AccreditationSection } from '@/components/sections/landing/AccreditationSection'
import { CertificationsSection } from '@/components/sections/landing/CertificationsSection'
import { StudentTestimonialsSection } from '@/components/sections/landing/StudentTestimonialsSection'
import { FAQSection } from '@/components/sections/landing/FAQSection'
import { FooterSection } from '@/components/sections/landing/FooterSection'
import { LandingHeader } from '@/components/sections/landing/LandingHeader'

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-16 text-[var(--color-text)] safe-area-pb">
      <LandingHeader />
      <HeroSection />
      <ExploreSection />
      <TrustedSection />
      <HowItWorksSection />
      <AccreditationSection />
      <CertificationsSection />
      <StudentTestimonialsSection />
      <FAQSection />
      <FooterSection />
    </main>
  )
}
