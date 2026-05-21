export function AccreditationSection() {
  return (
    <section
      id="about-us"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 md:px-6 md:py-20 lg:scroll-mt-28 lg:px-8"
    >
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.25fr_0.75fr] md:items-center">
        <img
          src="/landing/Screenshot%202026-03-23%20213619.png"
          alt="ICEF Agency Status certificate"
          className="w-full rounded-card border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]"
          loading="lazy"
        />
        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-accent">ICEF verified</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)] md:text-3xl">
            Agency status students and universities can verify.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            The certificate image is served from the public assets folder and remains available even when dynamic landing certificates are not configured.
          </p>
        </div>
      </div>
    </section>
  );
}
