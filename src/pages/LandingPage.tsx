import { HeroSection } from '@/components/sections/landing/HeroSection'
import { TrustedSection } from '@/components/sections/landing/TrustedSection'
import { ProblemSection } from '@/components/sections/landing/ProblemSection'
import { InfrastructureSection } from '@/components/sections/landing/InfrastructureSection'
import { MatchingEngineSection } from '@/components/sections/landing/MatchingEngineSection'
import { WalkthroughSection } from '@/components/sections/landing/WalkthroughSection'
import { StudentExperienceSection } from '@/components/sections/landing/StudentExperienceSection'
import { UniversityExperienceSection } from '@/components/sections/landing/UniversityExperienceSection'
import { ScholarshipSection } from '@/components/sections/landing/ScholarshipSection'
import { AIAssistantSection } from '@/components/sections/landing/AIAssistantSection'
import { GlobalNetworkSection } from '@/components/sections/landing/GlobalNetworkSection'
import { ScaleSection } from '@/components/sections/landing/ScaleSection'
import { FinalCtaSection } from '@/components/sections/landing/FinalCtaSection'
import { FooterSection } from '@/components/sections/landing/FooterSection'

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <HeroSection />
      <TrustedSection />
      <ProblemSection />
      <InfrastructureSection />
      <MatchingEngineSection />
      <WalkthroughSection />
      <StudentExperienceSection />
      <UniversityExperienceSection />
      <ScholarshipSection />
      <AIAssistantSection />
      <GlobalNetworkSection />
      <ScaleSection />
      <FinalCtaSection />
      <FooterSection />
    </main>
  )
}
