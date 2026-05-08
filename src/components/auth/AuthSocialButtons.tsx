import { useTranslation } from "react-i18next";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { YandexSignInButton } from "@/components/auth/YandexSignInButton";
import { AppleSignInButton } from "@/components/auth/AppleSignInButton";
import { savePendingTelegramAuthSession, startTelegramAuth } from "@/services/auth";

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
  const googleLogo =
    "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Search_logo.width-500.format-webp.webp";
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
  const telegramLabel = t("auth:continueWithTelegram", "Continue with Telegram");
  const handleTelegram = async () => {
    if (loading) return;
    setSubmitError("");
    setLoading(true);
    try {
      const data = await startTelegramAuth({ role });
      savePendingTelegramAuthSession({ sessionId: data.sessionId, role });
      window.location.href = data.deepLink;
    } catch {
      setSubmitError(t("errors:default"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-1">
      {showGoogleAuth && (
        <div
          className={`relative inline-flex h-11 w-11 min-w-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-0 ${loading ? "opacity-50" : ""}`}
          aria-label={googleLabel}
          aria-hidden={loading ? "true" : undefined}
          title={googleLabel}
        >
          <img
            src={googleLogo}
            alt={googleLabel}
            className="pointer-events-none h-5 w-5 object-contain"
            loading="lazy"
            decoding="async"
          />
          <GoogleSignInButton
            disabled={loading}
            autoPrompt={googleAutoPrompt}
            compact
            title={googleLabel}
            className="absolute inset-0 h-11 w-11 min-w-[44px] rounded-full p-0 opacity-0"
            onCredential={(c) => void onGoogleCredential(c)}
          />
        </div>
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
