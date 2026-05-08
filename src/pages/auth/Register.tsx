import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, GraduationCap, UserRoundCheck } from "lucide-react";
import {
  loginWithGoogle,
  register as registerApi,
  resendVerificationCode,
  verifyEmailByCode,
} from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import { getApiError } from "@/services/api";
import { getApiErrorKey } from "@/utils/apiErrorI18n";
import { navigateAfterRegistration } from "@/utils/navigateAfterAuth";
import { showOAuthPasswordReminder } from "@/utils/oauthPasswordToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardTitle } from "@/components/ui/Card";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { BrandMark } from "@/components/layout/BrandLogo";

type RegisterRole = "student" | "university" | "school_counsellor";
type SocialAuthRole = "student" | "university";
type EmailFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  role: RegisterRole;
  acceptTerms: boolean;
};

function toSocialAuthRole(role: RegisterRole): SocialAuthRole {
  return role === "university" ? "university" : "student";
}

export function Register() {
  const { t, i18n } = useTranslation(["common", "auth", "errors"]);
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("student");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"form" | "role" | "code">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingFormData, setPendingFormData] = useState<EmailFormData | null>(null);
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .min(8, t("auth:passwordMinLength"))
        .refine((p) => /[A-Z]/.test(p), t("auth:passwordUppercase", "At least one uppercase letter"))
        .refine((p) => /[a-z]/.test(p), t("auth:passwordLowercase", "At least one lowercase letter"))
        .refine((p) => /\d/.test(p), t("auth:passwordNumber", "At least one number")),
    [t],
  );

  const emailSchema = useMemo(
    () =>
      z
        .object({
          email: z.string().email(t("auth:invalidEmail")),
          password: passwordSchema,
          confirmPassword: z.string(),
          role: z.enum(["student", "university", "school_counsellor"]),
          acceptTerms: z.boolean().refine((v) => v === true, {
            message: t("auth:acceptTermsRequired"),
          }),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t("auth:passwordsMustMatch"),
          path: ["confirmPassword"],
        }),
    [passwordSchema, t],
  );

  const {
    register: registerEmailField,
    handleSubmit: handleEmailSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { role: "student", acceptTerms: false },
  });

  useEffect(() => {
    if (step !== "code" || resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, resendCooldown]);


  const handleGoogleCredential = async (credential: string) => {
    setSubmitError("");
    setLoading(true);
    try {
      const data = await loginWithGoogle({
        idToken: credential,
        role: toSocialAuthRole(getValues("role")),
        acceptTerms: true,
      });
      if (data.user.mustSetLocalPassword) {
        showOAuthPasswordReminder(t("auth:oauthPasswordToastTitle"), t("auth:oauthPasswordToastDesc"));
      }
      await navigateAfterRegistration(navigate, data.user, i18n);
    } catch (err) {
      const apiErr = getApiError(err);
      const errList = apiErr.errors as Array<{ field?: string; message?: string }> | undefined;
      const firstMsg = Array.isArray(errList) && errList[0]?.message ? errList[0].message : null;
      setSubmitError(firstMsg ?? apiErr.message ?? t(`errors:${getApiErrorKey(err)}`));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setCodeError("");
    try {
      await resendVerificationCode(pendingEmail);
      setResendCooldown(60);
    } catch (err) {
      const apiErr = getApiError(err);
      setCodeError(apiErr.message ?? t("errors:unknown"));
    } finally {
      setResendLoading(false);
    }
  };

  const onSubmitEmail = async (data: EmailFormData) => {
    setPendingFormData(data);
    setSelectedRole(data.role);
    setStep("role");
  };

  const onSubmitAfterRole = async () => {
    if (!pendingFormData) return;
    setSubmitError("");
    setLoading(true);
    try {
      const result = await registerApi({
        email: pendingFormData.email,
        password: pendingFormData.password,
        role: selectedRole,
        acceptTerms: true,
      });
      if ("needsVerification" in result && result.needsVerification) {
        setPendingEmail(result.email);
        setResendCooldown(60);
        setStep("code");
      } else if ("user" in result && result.user) {
        await navigateAfterRegistration(navigate, result.user, i18n);
      }
    } catch (err) {
      const apiErr = getApiError(err);
      const errList = apiErr.errors as Array<{ field?: string; message?: string }> | undefined;
      const firstMsg = Array.isArray(errList) && errList[0]?.message ? errList[0].message : null;
      setSubmitError(firstMsg ?? t(`errors:${getApiErrorKey(err)}`));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyEmailCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const codeInput = form.elements.namedItem("code") as HTMLInputElement;
    const code = codeInput?.value?.trim().replace(/\D/g, "").slice(0, 6);
    if (!code || code.length !== 6) {
      setCodeError(`${t("auth:enterCode")} - 6 digits`);
      return;
    }
    setCodeError("");
    setCodeLoading(true);
    try {
      const result = await verifyEmailByCode(pendingEmail, code);
      await navigateAfterRegistration(navigate, result.user, i18n);
    } catch (err) {
      const apiErr = getApiError(err);
      setCodeError(apiErr.message ?? t("errors:unknown"));
    } finally {
      setCodeLoading(false);
    }
  };


  if (step === "code") {
    return (
      <Card className="p-6">
        <CardTitle className="mb-2">{t("auth:verifyEmail")}</CardTitle>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          {t("auth:verificationCodeSent", { email: pendingEmail })}
        </p>
        <form onSubmit={onVerifyEmailCode} className="space-y-4">
          <Input
            label={t("auth:enterCode")}
            name="code"
            placeholder={t("auth:codePlaceholder")}
            maxLength={6}
            autoComplete="one-time-code"
            error={codeError}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCodeError("");
            }}
          />
          <Button type="submit" className="w-full" loading={codeLoading} disabled={codeLoading}>
            {t("auth:verifyAndContinue")}
          </Button>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="text-sm text-[var(--color-text-muted)] hover:underline"
            >
              {t("common:back", "Back")}
            </button>
            {resendCooldown > 0 ? (
              <span className="text-sm text-[var(--color-text-muted)]">
                {t("auth:resendIn", { seconds: resendCooldown })}
              </span>
            ) : (
              <button
                type="button"
                onClick={onResend}
                disabled={resendLoading}
                className="text-sm text-primary-accent hover:underline disabled:opacity-50"
              >
                {resendLoading ? t("common:loading") : t("auth:resendCode")}
              </button>
            )}
          </div>
        </form>
      </Card>
    );
  }

  if (step === "role") {
    const roleOptions: Array<{ role: RegisterRole; label: string; icon: typeof GraduationCap }> = [
      { role: "student", label: t("auth:roleStudent", "Student"), icon: GraduationCap },
      { role: "university", label: t("auth:roleUniversity", "University"), icon: Building2 },
      { role: "school_counsellor", label: t("auth:roleCounsellor", "Counsellor"), icon: UserRoundCheck },
    ];

    return (
      <Card className="p-6">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <BrandMark className="h-14 w-14" />
          <CardTitle>{t("auth:signupTitle", "Sign up to Edmission")}</CardTitle>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t("auth:chooseRole", "Choose who you are registering as")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {roleOptions.map(({ role, label, icon: Icon }) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={
                selectedRole === role
                  ? "flex items-center gap-3 rounded-card border-2 border-primary-accent px-3 py-2 text-left"
                  : "flex items-center gap-3 rounded-card border border-[var(--color-border)] px-3 py-2 text-left transition-colors hover:border-primary-accent/50"
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0 text-primary-accent" />
              {label}
            </button>
          ))}
        </div>
        {submitError && <p className="mt-3 text-sm text-red-500">{submitError}</p>}
        <Button
          type="button"
          className="mt-4 w-full"
          loading={loading}
          disabled={loading}
          onClick={() => {
            setValue("role", selectedRole, { shouldValidate: true });
            void onSubmitAfterRole();
          }}
        >
          {t("common:register", "Register")}
        </Button>
        <button
          type="button"
          onClick={() => setStep("form")}
          className="mt-3 block w-full text-center text-sm text-[var(--color-text-muted)] hover:underline"
        >
          {t("common:back", "Back")}
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <BrandMark className="h-14 w-14" />
        <CardTitle>{t("auth:signupTitle", "Sign up to Edmission")}</CardTitle>
      </div>

      <form onSubmit={handleEmailSubmit(onSubmitEmail)} className="space-y-4">
        <Input
          label={t("auth:email")}
          type="email"
          autoComplete="email"
          placeholder={t("auth:emailPlaceholder")}
          error={errors.email?.message}
          {...registerEmailField("email")}
        />
        <Input
          label={t("auth:password")}
          type="password"
          autoComplete="new-password"
          hint={t("auth:passwordRequirements", "8+ chars, uppercase, lowercase, number")}
          error={errors.password?.message}
          passwordVisible={showPassword}
          onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
          showPasswordToggle
          {...registerEmailField("password")}
        />
        <Input
          label={t("auth:confirmPassword")}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          passwordVisible={showPassword}
          onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
          showPasswordToggle
          {...registerEmailField("confirmPassword")}
        />
        <input type="hidden" {...registerEmailField("role")} />
        <Checkbox
          {...registerEmailField("acceptTerms")}
          label={
            <span className="text-sm text-[var(--color-text)]">
              {t("auth:acceptTerms")}{" "}
              <Link to="/privacy" className="text-primary-accent underline hover:no-underline">
                {t("common:privacy")}
              </Link>
            </span>
          }
        />
        {errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>}
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          {t("common:register")}
        </Button>
      </form>

      {(selectedRole === "student" || selectedRole === "university") && (
        <div className="mt-6 space-y-4">
          <AuthSocialButtons
            mode="register"
            loading={loading}
            role={selectedRole}
            yandexAcceptTerms
            setLoading={setLoading}
            setSubmitError={setSubmitError}
            onGoogleCredential={handleGoogleCredential}
            onAppleSuccess={async () => {
              setSubmitError("");
              const user = useAuthStore.getState().user;
              if (user) {
                if (user.mustSetLocalPassword) {
                  showOAuthPasswordReminder(t("auth:oauthPasswordToastTitle"), t("auth:oauthPasswordToastDesc"));
                }
                await navigateAfterRegistration(navigate, user, i18n);
              }
            }}
            onYandexSuccess={async () => {
              setSubmitError("");
              const user = useAuthStore.getState().user;
              if (user) {
                if (user.mustSetLocalPassword) {
                  showOAuthPasswordReminder(t("auth:oauthPasswordToastTitle"), t("auth:oauthPasswordToastDesc"));
                }
                await navigateAfterRegistration(navigate, user, i18n);
              }
            }}
          />
        </div>
      )}

      <Link to="/login" className="mt-4 block text-center text-sm text-[var(--color-text-muted)] hover:underline">
        {t("auth:haveAccount")} {t("common:signIn", "Sign in")}
      </Link>
    </Card>
  );
}
