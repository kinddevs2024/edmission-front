import { MatchingEngineSection } from './MatchingEngineSection'
import { WalkthroughSection } from './WalkthroughSection'
import { CtaBlock } from './CtaBlock'
import { StudentExperienceSection } from './StudentExperienceSection'
import { UniversityExperienceSection } from './UniversityExperienceSection'
import { ScholarshipSection } from './ScholarshipSection'
import { AIAssistantSection } from './AIAssistantSection'
import { GlobalNetworkSection } from './GlobalNetworkSection'
import { ScaleSection } from './ScaleSection'

export function LandingBelowFold() {
  return (
    <>
      <MatchingEngineSection />
      <WalkthroughSection />
      <CtaBlock />
      <StudentExperienceSection />
      <UniversityExperienceSection />
      <ScholarshipSection />
      <AIAssistantSection />
      <GlobalNetworkSection />
      <ScaleSection />
    </>
  )
}
