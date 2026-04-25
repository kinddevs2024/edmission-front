import { Link } from 'react-router-dom'
import { Bot, CheckCircle, FileText, Gift, GraduationCap, SearchCheck } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'

const steps = [
  {
    icon: GraduationCap,
    title: 'Build your student profile',
    body: 'Add education, languages, budget, documents, interests, and goals. This becomes the source for recommendations and university review.',
  },
  {
    icon: Bot,
    title: 'AI matching explains fit',
    body: 'Edmission compares your profile with requirements, tuition, location, language level, scholarships, and available programs.',
  },
  {
    icon: SearchCheck,
    title: 'Explore and show interest',
    body: 'Shortlist universities, compare options, and show interest when you are ready to be reviewed.',
  },
  {
    icon: FileText,
    title: 'Universities review your profile',
    body: 'Universities can open chats, ask for documents, move your application through their pipeline, and prepare offers.',
  },
  {
    icon: Gift,
    title: 'Decide on offers and scholarships',
    body: 'When an offer arrives, you can accept, reject, or postpone the decision before the deadline.',
  },
]

export function HowEdmissionWorks() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-page-bottom-cta">
      <PageTitle title="How Edmission works" icon="GraduationCap" />
      <section className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          Edmission is a direct admission workspace: students prepare one strong profile, AI helps surface university matches,
          and universities can send offers or scholarships directly through the platform.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button to="/student/profile">Complete profile</Button>
          <Button to="/student/universities" variant="secondary">Explore universities</Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <Card key={step.title} className="h-full">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-accent/12 text-primary-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base">{index + 1}. {step.title}</CardTitle>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{step.body}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" aria-hidden />
          Daily checklist
        </CardTitle>
        <div className="mt-3 grid gap-2 text-sm text-[var(--color-text-muted)] sm:grid-cols-2">
          <Link className="hover:text-primary-accent" to="/student/profile">Profile complete enough for matching</Link>
          <Link className="hover:text-primary-accent" to="/student/documents">Core documents uploaded</Link>
          <Link className="hover:text-primary-accent" to="/student/universities">At least one university shortlisted</Link>
          <Link className="hover:text-primary-accent" to="/student/offers">Offer deadlines reviewed</Link>
        </div>
      </Card>

      <Card>
        <CardTitle>Video tutorials</CardTitle>
        <div className="mt-3 aspect-video w-full overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--color-text-muted)]">
            Video walkthroughs can be embedded here when the first tutorial clips are ready.
          </div>
        </div>
      </Card>
    </div>
  )
}

export default HowEdmissionWorks
