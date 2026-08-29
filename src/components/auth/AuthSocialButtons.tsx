import { useTranslation } from "react-i18next";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { YandexSignInButton } from "@/components/auth/YandexSignInButton";
import { AppleSignInButton } from "@/components/auth/AppleSignInButton";
import {
  savePendingTelegramAuthSession,
  startTelegramAuth,
} from "@/services/auth";
import { cn } from "@/utils/cn";

const TELEGRAM_BOT_URL = "https://t.me/Edmission_bot";

type AuthSocialButtonsProps = {
  mode: "login" | "register";
  loading: boolean;
  role?: "student" | "university";
  googleAutoPrompt?: boolean;
  yandexAcceptTerms?: boolean;
  setLoading: (value: boolean) => void;
  setSubmitError: (message: string) => void;
  onGoogleCredential: (credential: string) => void | Promise<void>;
  onAppleSuccess: () => void | Promise<void>;
  onYandexSuccess: () => void | Promise<void>;
};

export function AuthSocialButtons({
  mode,
  loading,
  role = "student",
  googleAutoPrompt = false,
  yandexAcceptTerms = true,
  setLoading,
  setSubmitError,
  onGoogleCredential,
  onAppleSuccess,
  onYandexSuccess,
}: AuthSocialButtonsProps) {
  const { t } = useTranslation(["auth", "errors"]);
  const showGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  const showAppleAuth = Boolean(import.meta.env.VITE_APPLE_CLIENT_ID?.trim());
  const showYandexAuth = Boolean(import.meta.env.VITE_YANDEX_CLIENT_ID?.trim());
  const yandexLogo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Yandex_icon.svg/1280px-Yandex_icon.svg.png";
  const telegramLogo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Telegram_2019_Logo.svg/250px-Telegram_2019_Logo.svg.png";
  const googleLabel = t("auth:continueWithGoogle", "Continue with Google");
  const yandexLabel =
    mode === "register"
      ? t("auth:registerWithYandexId", "Register with Yandex ID")
      : t("auth:signInWithYandexId", "Sign in with Yandex ID");
  const appleLabel =
    mode === "register"
      ? t("auth:registerWithAppleId", "Register with Apple ID")
      : t("auth:signInWithAppleId", "Sign in with Apple ID");
  const telegramLabel = t(
    "auth:continueWithTelegram",
    "Continue with Telegram",
  );
  const handleTelegram = async () => {
    if (loading) return;
    setSubmitError("");
    setLoading(true);
    try {
      const data = await startTelegramAuth({ role });
      savePendingTelegramAuthSession({ sessionId: data.sessionId, role });
      window.location.href = data.deepLink || TELEGRAM_BOT_URL;
    } catch {
      window.location.href = TELEGRAM_BOT_URL;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-1">
      {showGoogleAuth && (
        <GoogleSignInButton
          disabled={loading}
          autoPrompt={googleAutoPrompt}
          compact
          title={googleLabel}
          className="h-11 w-11 min-w-[44px] overflow-hidden rounded-full"
          onCredential={(c) => void onGoogleCredential(c)}
        />
      )}
      {showYandexAuth && (
        <div title={yandexLabel} aria-label={yandexLabel}>
          <YandexSignInButton
            disabled={loading}
            role={role}
            acceptTerms={yandexAcceptTerms}
            flow={mode}
            logoUrl={yandexLogo}
            compact
            title={yandexLabel}
            className="h-11 w-11 min-w-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-0"
            onBusyChange={setLoading}
            onError={(msg) => setSubmitError(msg)}
            onSuccess={() => void onYandexSuccess()}
          />
        </div>
      )}
      {showAppleAuth && (
        <div title={appleLabel} aria-label={appleLabel}>
          <AppleSignInButton
            disabled={loading}
            role={role}
            acceptTerms={mode === "login" ? true : yandexAcceptTerms}
            flow={mode}
            compact
            title={appleLabel}
            className="h-11 w-11 min-w-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-0"
            onBusyChange={setLoading}
            onError={(msg) => setSubmitError(msg)}
            onSuccess={() => void onAppleSuccess()}
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => void handleTelegram()}
        disabled={loading}
        className="inline-flex h-11 w-11 min-w-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-0 transition-[opacity,transform] duration-150 hover:opacity-95 active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={telegramLabel}
        title={telegramLabel}
      >
        <img
          src={telegramLogo}
          alt={telegramLabel}
          className="h-5 w-5 object-contain"
          loading="lazy"
          decoding="async"
        />
      </button>
    </div>
  );
}

export function LandingSocialAuthLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { t } = useTranslation("auth");
  const showGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  const showYandexAuth = Boolean(import.meta.env.VITE_YANDEX_CLIENT_ID?.trim());
  const googleLabel = t("auth:continueWithGoogle");
  const yandexLabel = t("auth:continueWithYandex");
  const telegramLabel = t("auth:continueWithTelegram");

  const linkClass =
    "flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-medium text-[var(--color-text)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_2px_0_0_rgba(0,0,0,0.04)] transition-colors hover:border-primary-accent/40 hover:bg-[var(--color-bg)]";

  return (
    <div className={cn("space-y-2.5", className)}>
      {showGoogleAuth && (
        <a href="/login" onClick={onNavigate} className={linkClass}>
          <img
            src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Search_logo.width-500.format-webp.webp"
            alt=""
            className="h-5 w-5 object-contain"
            loading="lazy"
          />
          <span>{googleLabel}</span>
        </a>
      )}
      {showYandexAuth && (
        <a href="/login" onClick={onNavigate} className={linkClass}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Yandex_icon.svg/1280px-Yandex_icon.svg.png"
            alt=""
            className="h-5 w-5 object-contain"
            loading="lazy"
          />
          <span>{yandexLabel}</span>
        </a>
      )}
      <a href="/login" onClick={onNavigate} className={linkClass}>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Telegram_2019_Logo.svg/250px-Telegram_2019_Logo.svg.png"
          alt=""
          className="h-5 w-5 object-contain"
          loading="lazy"
        />
        <span>{telegramLabel}</span>
      </a>
    </div>
  );
}
