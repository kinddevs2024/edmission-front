/**
 * Lazy-route loading UI. Не используем position:fixed: родители с transform (например animate-page-enter)
 * создают новый containing block — fixed тогда «липнет» к узкой области и спиннер оказывается сверху.
 */
import { useTranslation } from "react-i18next";

export function ContentFallback() {
  const { t } = useTranslation("common");
  return (
    <div
      className="flex w-full flex-1 items-center justify-center py-16 min-h-[max(12rem,calc(100dvh-8rem))]"
      role="status"
      aria-live="polite"
      aria-label={t("loading")}
    >
      <div
        className="h-8 w-8 shrink-0 rounded-full border-2 border-[var(--color-primary-accent)] border-t-transparent animate-spin"
        aria-hidden
      />
    </div>
  );
}
