export const supportedLngs = ["en", "ru", "uz"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

export const defaultNS = "common";
export const fallbackLng = "en";

export const namespaces = [
  "common",
  "auth",
  "landing",
  "cookies",
  "student",
  "university",
  "admin",
  "school",
  "documents",
  "errors",
  "chat",
] as const;

export const STORAGE_KEY = "i18nextLng";

function fromUrlParam(): SupportedLng | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const param = (
      url.searchParams.get("lang") ||
      url.searchParams.get("lng") ||
      ""
    ).toLowerCase();
    if (param === "en" || param === "ru" || param === "uz") return param;
  } catch {
    /* ignore */
  }
  return null;
}

/** Browser's primary language code (e.g. 'en', 'ru', 'uz', 'de'). */
export function getBrowserLanguageCode(): string {
  if (typeof navigator === "undefined") return "";
  const preferred =
    navigator.language || (navigator.languages && navigator.languages[0]) || "";
  return preferred.split("-")[0].toLowerCase();
}

/** True if browser's primary language is one of our supported (uz, en, ru). */
export function isBrowserLanguageSupported(): boolean {
  const code = getBrowserLanguageCode();
  return code === "en" || code === "ru" || code === "uz";
}

/** Language explicitly saved by the user (landing, auth, or onboarding). */
export function getSavedLanguageIfSupported(): SupportedLng | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const code = saved.split("-")[0].toLowerCase();
    if (supportedLngs.includes(code as SupportedLng))
      return code as SupportedLng;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * First language in the user's browser/OS preference list that we support (en, ru, uz).
 * Mirrors Chrome's language list (similar idea to account locale lists): e.g. ['de-DE','en-US'] → 'en'.
 */
export function getFirstSupportedNavigatorLanguage(): SupportedLng | null {
  if (typeof navigator === "undefined") return null;
  const list =
    navigator.languages && navigator.languages.length > 0
      ? [...navigator.languages]
      : [navigator.language].filter(Boolean);
  for (const raw of list) {
    const code = String(raw).split("-")[0].toLowerCase();
    if (code === "en" || code === "ru" || code === "uz")
      return code as SupportedLng;
  }
  return null;
}

/**
 * Show explicit language UI only when we cannot infer en/ru/uz from storage or from the browser list.
 * Avoids a second picker after the user already chose on the landing or when e.g. English is a secondary browser language.
 */
export function needsExplicitLanguageChoice(): boolean {
  if (getSavedLanguageIfSupported()) return false;
  return getFirstSupportedNavigatorLanguage() === null;
}

/** Returns browser-preferred language if supported; otherwise fallback. */
export function getBrowserPreferredLanguage(): SupportedLng {
  const code = getBrowserLanguageCode();
  if (code === "ru") return "ru";
  if (code === "uz") return "uz";
  return "uz";
}

/** Initial language: saved choice or browser preference. */
export function getInitialLanguage(): SupportedLng {
  const fromUrl = fromUrlParam();
  if (fromUrl) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const code = saved.split("-")[0].toLowerCase();
      if (supportedLngs.includes(code as SupportedLng))
        return code as SupportedLng;
    }
  } catch {
    /* ignore */
  }
  return getBrowserPreferredLanguage();
}
