import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n, { loadLanguage } from "@/i18n";
import { supportedLngs, STORAGE_KEY, type SupportedLng } from "@/i18n/config";
import { cn } from "@/utils/cn";

const LANGUAGE_LABELS: Record<SupportedLng, string> = {
  en: "English",
  ru: "Русский",
  uz: "O'zbek",
};

const LANGUAGE_FLAG_SRC: Record<SupportedLng, string> = {
  en: "https://flagcdn.com/w80/us.png",
  ru: "https://flagcdn.com/w80/ru.png",
  uz: "https://flagcdn.com/w80/uz.png",
};

export function LanguageMenu({
  placement = "bottom",
}: {
  placement?: "bottom" | "top";
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLng = (i18n.language?.split("-")[0] || "en") as SupportedLng;
  const currentLabel = LANGUAGE_LABELS[currentLng] ?? currentLng.toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (lng: SupportedLng) => {
    setOpen(false);
    loadLanguage(lng).then(() => {
      i18n.changeLanguage(lng);
      try {
        localStorage.setItem(STORAGE_KEY, lng);
      } catch {
        /* ignore */
      }
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-2 px-3 rounded-input text-sm font-semibold transition-all duration-100 ease-out transform active:translate-y-[3px]",
          "border border-t-white/50 border-x-[var(--color-border)] border-b-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)]",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_3px_0_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04)]",
          "hover:bg-[var(--color-bg)] hover:-translate-y-[1px] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_4px_0_0_rgba(0,0,0,0.06),0_6px_10px_0_rgba(0,0,0,0.06)]",
          "active:translate-y-[3px] active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_0px_0_0_rgba(0,0,0,0.06),0_1px_3px_0_rgba(0,0,0,0.03)]"
        )}
        aria-label={t("language")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span
          className="flex h-4 w-4 shrink-0 overflow-hidden rounded-full border border-black/10"
          aria-hidden
        >
          <img
            src={LANGUAGE_FLAG_SRC[currentLng] ?? LANGUAGE_FLAG_SRC.en}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </span>
        <span className="font-medium hidden sm:inline">{currentLabel}</span>
        <svg
          className={cn(
            "h-4 w-4 text-[var(--color-text-muted)] transition-transform",
            open && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-[60] min-w-[160px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-lg animate-modal-enter",
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1",
          )}
          role="menu"
        >
          {supportedLngs.map((lng) => (
            <button
              key={lng}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(lng)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
                currentLng === lng
                  ? "bg-primary-accent/15 text-primary-accent font-medium"
                  : "text-[var(--color-text)] hover:bg-[var(--color-border)]/20",
              )}
            >
              <span
                className="flex h-5 w-5 shrink-0 overflow-hidden rounded-full border border-black/10"
                aria-hidden
              >
                <img
                  src={LANGUAGE_FLAG_SRC[lng]}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </span>
              <span className="flex-1">{LANGUAGE_LABELS[lng]}</span>
              {currentLng === lng && (
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
