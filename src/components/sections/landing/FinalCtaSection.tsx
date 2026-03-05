import { Button } from '@/components/ui/Button'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { Card } from '@/components/ui/Card'

export function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <Reveal>
        <Card className="p-8 md:p-12" interactive>
          <SectionHeading
            align="center"
            eyebrow="Get Started"
            title="Join the Future of Academic Admissions"
            description="Build transparent admission workflows for students and universities on a single intelligent platform."
            actions={(
              <>
                <Button to="/register" size="lg">Create Student Account</Button>
                <Button to="/register?role=university" variant="secondary" size="lg">Register University</Button>
              </>
            )}
          />
        </Card>
      </Reveal>
    </section>
  )
}
