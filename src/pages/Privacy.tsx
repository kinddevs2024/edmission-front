import { Card, CardTitle } from '@/components/ui/Card'

export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Privacy Policy</h1>
      <p className="text-[var(--color-text-muted)] mb-8">Last updated: February 2025</p>

      <Card className="p-6 space-y-6">
        <section>
          <CardTitle>1. Information we collect</CardTitle>
          <p className="text-[var(--color-text-muted)] mt-2">
            We collect information you provide when registering (email, name, role), when completing your profile (education, documents, preferences), and when you use the platform (applications, messages, usage data). We may also collect device and log data for security and analytics.
          </p>
        </section>
        <section>
          <CardTitle>2. How we use your information</CardTitle>
          <p className="text-[var(--color-text-muted)] mt-2">
            We use your information to operate the platform, match students with universities, send notifications you have agreed to (e.g. application status, trial reminders), process payments, verify documents, and improve our services. We do not sell your personal data to third parties.
          </p>
        </section>
        <section>
          <CardTitle>3. Data sharing</CardTitle>
          <p className="text-[var(--color-text-muted)] mt-2">
            Profile and application data may be shared with universities you apply to. We use trusted service providers (e.g. hosting, email, payment processing) under strict agreements. We may disclose data when required by law or to protect our rights and safety.
          </p>
        </section>
        <section>
          <CardTitle>4. Security and retention</CardTitle>
          <p className="text-[var(--color-text-muted)] mt-2">
            We use industry-standard measures to protect your data. We retain your data for as long as your account is active or as needed to provide services and comply with legal obligations. You can request deletion of your account and associated data via support.
          </p>
        </section>
        <section>
          <CardTitle>5. Your rights</CardTitle>
          <p className="text-[var(--color-text-muted)] mt-2">
            You can access and update your profile and notification preferences in your account. You may request a copy of your data, correction, or deletion. In some regions you have additional rights (e.g. object to processing, data portability). Contact us at support for any request.
          </p>
        </section>
        <section>
          <CardTitle>6. Contact</CardTitle>
          <p className="text-[var(--color-text-muted)] mt-2">
            For privacy-related questions or requests, contact us through the Support section or at the contact details provided on the platform.
          </p>
        </section>
      </Card>
    </div>
  )
}
