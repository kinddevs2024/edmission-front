import type { Offer } from '@/types/student'

interface OfferCertificateViewProps {
  offer: Offer & {
    certificateTitle?: string
    certificateBody?: string
  }
}

export function OfferCertificateView({ offer }: OfferCertificateViewProps) {
  const title = offer.certificateTitle ?? 'Offer certificate'
  const body = offer.certificateBody ?? ''
  const studentName = '' // optionally use from context in the future

  return (
    <div className="relative mx-auto max-w-xl rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-bg-muted)] px-6 py-8 shadow-2xl overflow-hidden">
      {/* Confetti layers */}
      <div className="pointer-events-none absolute inset-0">
        <ConfettiPiece className="left-4 top-2 bg-pink-400" delay="0s" />
        <ConfettiPiece className="right-6 top-4 bg-sky-400" delay="0.2s" />
        <ConfettiPiece className="left-1/3 top-0 bg-amber-400" delay="0.4s" />
        <ConfettiPiece className="right-1/4 top-1 bg-emerald-400" delay="0.6s" />
      </div>

      <div className="relative space-y-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)]">
            Certificate of Offer
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
            {title}
          </h2>
        </div>
        <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-[var(--color-primary-accent)] to-transparent" />
        <div className="space-y-2 text-sm text-[var(--color-text-muted)] text-center">
          {studentName && (
            <p className="text-[var(--color-text)] font-medium">
              Dear {studentName},
            </p>
          )}
          {body ? body.split('\n').map((line: string, idx: number) => (
            <p key={idx}>{line}</p>
          )) : (
            <p>
              You have received an academic offer from {offer.universityName ?? offer.universityId}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfettiPiece({ className, delay }: { className?: string; delay?: string }) {
  return (
    <div
      className={`absolute h-3 w-1 rounded-sm opacity-80 animate-confetti-fall ${className ?? ''}`}
      style={{ animationDelay: delay }}
      aria-hidden
    />
  )
}

