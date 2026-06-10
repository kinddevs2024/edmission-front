import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Building2, CheckCircle2, GraduationCap, User } from "lucide-react";
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
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardTitle } from "@/components/ui/Card";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { AuthStepTransition } from "@/components/auth/AuthStepTransition";
import { BrandMark } from "@/components/layout/BrandLogo";

type RegisterRole = "student" | "university";
type EmailFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  role: RegisterRole;
  acceptTerms: boolean;
};

const roleConfig = {
  student: {
    icon: GraduationCap,
    bullets: [
      "auth:roleStudentBulletFindUniversities",
      "auth:roleStudentBulletScholarshipOffers",
      "auth:roleStudentBulletTelegramUpdates",
    ],
  },
  university: {
    icon: Building2,
    bullets: [
      "auth:roleUniversityBulletStudentInterests",
      "auth:roleUniversityBulletDirectChat",
      "auth:roleUniversityBulletOffersAndScholarships",
    ],
  },
} satisfies Record<RegisterRole, { icon: typeof GraduationCap; bullets: Array<`auth:${string}`> }>;

function initialRoleFromQuery(value: string | null): RegisterRole {
  return value === "university" ? "university" : "student";
}

export function Register() {
  const { t, i18n } = useTranslation(["common", "auth", "errors"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = initialRoleFromQuery(searchParams.get("role"));
  const [selectedRole, setSelectedRole] = useState<RegisterRole>(initialRole);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"role" | "form" | "code">("role");
  const [pendingEmail, setPendingEmail] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeReadOnly, setCodeReadOnly] = useState(true);
  const [verificationEmailSent, setVerificationEmailSent] = useState(true);

  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .min(8, t("auth:passwordMinLength"))
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
          role: z.enum(["student", "university"]),
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
    control,
    handleSubmit: handleEmailSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { role: initialRole, acceptTerms: false },
  });

  useEffect(() => {
    setValue("role", selectedRole, { shouldValidate: true });
  }, [selectedRole, setValue]);

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
        role: getValues("role"),
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

  const submitRegistration = async (formData: EmailFormData) => {
    const role = selectedRole;
    setSubmitError("");
    setLoading(true);
    try {
      const result = await registerApi({
        email: formData.email,
        password: formData.password,
        role,
        acceptTerms: true,
      });
      if ("needsVerification" in result && result.needsVerification) {
        setPendingEmail(result.email);
        setVerificationEmailSent(result.emailSent !== false);
        setVerificationCode(result.devVerificationCode ?? "");
        setCodeReadOnly(!result.devVerificationCode);
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

  const onSubmitEmail = async (data: EmailFormData) => {
    await submitRegistration({ ...data, role: selectedRole });
  };

  const onResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setCodeError("");
    try {
      const result = await resendVerificationCode(pendingEmail);
      setVerificationEmailSent(result.emailSent !== false)
      if (result.devVerificationCode) {
        setVerificationCode(result.devVerificationCode)
        setCodeReadOnly(false)
      }
      setResendCooldown(60);
    } catch (err) {
      const apiErr = getApiError(err);
      setCodeError(apiErr.message ?? t("errors:unknown"));
    } finally {
      setResendLoading(false);
    }
  };

  const onVerifyEmailCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = verificationCode.trim().replace(/\D/g, "").slice(0, 6);
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
      <AuthStepTransition stepKey="code">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <BrandMark className="h-10 w-10" />
            <div>
              <CardTitle>{t("auth:verifyEmail")}</CardTitle>
              <p className="text-sm text-[var(--color-text-muted)]">
                {verificationEmailSent
                  ? t("auth:verificationCodeSentIntro", "We sent a 6-digit code to:")
                  : t("auth:verificationEmailFailedIntro", "Email delivery failed. Development verification is active for:")}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text)] break-all">{pendingEmail}</p>
            </div>
          </div>
          {!verificationEmailSent ? (
            <p className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
              {t("auth:verificationEmailFailedHint", "The code was not emailed because SMTP authentication failed. A local development code was inserted below.")}
            </p>
          ) : null}
          <form onSubmit={onVerifyEmailCode} className="space-y-4" autoComplete="off">
            <Input
              label={t("auth:enterCode")}
              name="verification-code"
              value={verificationCode}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t("auth:codePlaceholder")}
              maxLength={6}
              autoComplete="one-time-code"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              readOnly={codeReadOnly}
              onFocus={() => setCodeReadOnly(false)}
              error={codeError}
              onChange={(e) => {
                setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
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
                className="cursor-pointer text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
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
                  className="cursor-pointer text-sm font-medium text-primary-accent hover:opacity-80 disabled:opacity-50"
                >
                  {resendLoading ? t("common:loading") : t("auth:resendCode")}
                </button>
              )}
            </div>
          </form>
        </Card>
      </AuthStepTransition>
    );
  }

  if (step === "role") {
    const roles: RegisterRole[] = ["student", "university"];

    return (
      <AuthStepTransition stepKey="role">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--color-border)] p-6 text-center">
          <BrandMark className="mx-auto h-12 w-12" />
          <CardTitle className="mt-4">{t("auth:signupTitle", "Sign up to Edmission")}</CardTitle>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t("auth:chooseRole", "Choose your account type")}
          </p>
        </div>

        <div className="space-y-3 p-4">
          {roles.map((role) => {
            const selected = selectedRole === role;
            const Icon = roleConfig[role].icon;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={
                  selected
                    ? "flex w-full cursor-pointer items-start gap-3 rounded-xl border border-primary-accent bg-primary-accent/10 p-4 text-left ring-2 ring-primary-accent/8"
                    : "flex w-full cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left transition-colors duration-150 hover:border-primary-accent/60 hover:bg-[var(--color-bg)]"
                }
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                  <Icon className="h-5 w-5 text-primary-accent" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--color-text)]">
                      {role === "student"
                        ? t("auth:roleStudent", "Student")
                        : t("auth:roleUniversity", "University")}
                    </span>
                    {selected ? <CheckCircle2 className="h-5 w-5 text-primary-accent" /> : null}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {roleConfig[role].bullets.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                      >
                        {t(item)}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            );
          })}

          <Button type="button" className="w-full" size="lg" icon={<ArrowRight />} onClick={() => setStep("form")}>
            {selectedRole === "student"
              ? t("auth:continueAsStudent", "Continue as student")
              : t("auth:continueAsUniversity", "Continue as university")}
          </Button>
          <Link to="/login" className="block text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            {t("auth:haveAccount")} {t("common:signIn", "Sign in")}
          </Link>
        </div>
      </Card>
      </AuthStepTransition>
    );
  }

  return (
    <AuthStepTransition stepKey="form">
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep("role")}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-primary-accent"
          aria-label={t("common:back", "Back")}
        >
          {selectedRole === "student" ? <GraduationCap className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
        </button>
        <div className="min-w-0">
          <CardTitle>
            {selectedRole === "student"
              ? t("auth:createStudentAccount", "Create student account")
              : t("auth:createUniversityAccount", "Create university account")}
          </CardTitle>
          <p className="text-sm text-[var(--color-text-muted)]">
            {selectedRole === "student"
              ? t("auth:studentSignupHint", "Find universities, offers, and scholarships.")
              : t("auth:universitySignupHint", "Manage students, interests, and offers.")}
          </p>
        </div>
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
        <Controller
          name="password"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <PasswordInput
              label={t("auth:password")}
              autoComplete="new-password"
              hint={t("auth:passwordRequirements", "8+ chars, lowercase, number")}
              error={errors.password?.message}
              passwordVisible={showPassword}
              onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <PasswordInput
              label={t("auth:confirmPassword")}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              passwordVisible={showPassword}
              onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
        <input type="hidden" {...registerEmailField("role")} />
        <Checkbox
          {...registerEmailField("acceptTerms")}
          label={
            <span className="text-sm text-[var(--color-text)]">
              {t("auth:acceptTerms")}{" "}
              <Link to="/privacy" className="font-medium text-primary-accent hover:opacity-80">
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

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">
          {t("auth:orContinueWith", "Or continue with")}
        </span>
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

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

      <button
        type="button"
        onClick={() => setStep("role")}
        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <User className="h-4 w-4" />
        {t("auth:changeAccountType", "Change account type")}
      </button>
    </Card>
    </AuthStepTransition>
  );
}
