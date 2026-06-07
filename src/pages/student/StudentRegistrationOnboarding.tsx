import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Briefcase,
  Cpu,
  DollarSign,
  FlaskConical,
  Globe2,
  GraduationCap,
  Heart,
  HeartPulse,
  Leaf,
  Palette,
  Scale,
  Stethoscope,
  User,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableChipSelect } from "@/components/ui/SearchableChipSelect";
import { Select } from "@/components/ui/Select";
import { cn } from "@/utils/cn";
import { FIELD_OF_STUDY } from "@/constants/fieldOfStudy";
import { getProfileCriteria } from "@/services/options";
import { updateProfile } from "@/services/auth";
import { getStudentProfile, updateStudentProfile } from "@/services/student";
import { needsStudentRegistrationOnboarding } from "@/utils/studentRegistrationOnboarding";
import { toastApiError } from "@/utils/toastError";
import { useAuthStore } from "@/store/authStore";

type Step = "name" | "faculty" | "hobby" | "budget";

const STEPS: Step[] = ["name", "faculty", "hobby", "budget"];

const FIELD_ICONS: Record<string, LucideIcon> = {
  business_management_economics: Briefcase,
  engineering_technology: GraduationCap,
  computer_science_digital_technologies: Cpu,
  natural_sciences: FlaskConical,
  health_medical_sciences: HeartPulse,
  social_sciences_humanities: Globe2,
  creative_arts_media_design: Palette,
  education: BookOpen,
  environment_agriculture_sustainability: Leaf,
  hospitality_tourism_service: UtensilsCrossed,
  law_legal_studies: Scale,
  medicine_clinical: Stethoscope,
  linguistics_foreign_languages: Globe2,
  sports_physical_education: Heart,
  performing_arts_music: Palette,
};

const FIELD_COLORS: Record<
  string,
  {
    icon: { bg: string; text: string };
    selected: { bg: string; text: string };
  }
> = {
  business_management_economics: {
    icon: { bg: "#fef3c7", text: "#b45309" },
    selected: { bg: "#d97706", text: "#ffffff" },
  },
  engineering_technology: {
    icon: { bg: "#e0f2fe", text: "#0369a1" },
    selected: { bg: "#0284c7", text: "#ffffff" },
  },
  computer_science_digital_technologies: {
    icon: { bg: "#ede9fe", text: "#5b21b6" },
    selected: { bg: "#7c3aed", text: "#ffffff" },
  },
  natural_sciences: {
    icon: { bg: "#cffafe", text: "#0891b2" },
    selected: { bg: "#0891b2", text: "#ffffff" },
  },
  health_medical_sciences: {
    icon: { bg: "#fce7f3", text: "#be185d" },
    selected: { bg: "#db2777", text: "#ffffff" },
  },
  social_sciences_humanities: {
    icon: { bg: "#d1fae5", text: "#047857" },
    selected: { bg: "#059669", text: "#ffffff" },
  },
  creative_arts_media_design: {
    icon: { bg: "#f5e6ff", text: "#a21caf" },
    selected: { bg: "#d946ef", text: "#ffffff" },
  },
  education: {
    icon: { bg: "#e0e7ff", text: "#4338ca" },
    selected: { bg: "#4f46e5", text: "#ffffff" },
  },
  environment_agriculture_sustainability: {
    icon: { bg: "#ccfb3d", text: "#65a30d" },
    selected: { bg: "#84cc16", text: "#ffffff" },
  },
  hospitality_tourism_service: {
    icon: { bg: "#fed7aa", text: "#b45309" },
    selected: { bg: "#ea580c", text: "#ffffff" },
  },
  law_legal_studies: {
    icon: { bg: "#ffe4e6", text: "#be185d" },
    selected: { bg: "#e11d48", text: "#ffffff" },
  },
  medicine_clinical: {
    icon: { bg: "#fce7f3", text: "#be185d" },
    selected: { bg: "#e11d48", text: "#ffffff" },
  },
  linguistics_foreign_languages: {
    icon: { bg: "#f1f5f9", text: "#475569" },
    selected: { bg: "#64748b", text: "#ffffff" },
  },
  sports_physical_education: {
    icon: { bg: "#d1fae5", text: "#047857" },
    selected: { bg: "#059669", text: "#ffffff" },
  },
  performing_arts_music: {
    icon: { bg: "#ede9fe", text: "#5b21b6" },
    selected: { bg: "#7c3aed", text: "#ffffff" },
  },
};

function getFieldIcon(id: string): LucideIcon {
  return FIELD_ICONS[id] ?? BookOpen;
}

function getFieldStyle(id: string) {
  return (
    FIELD_COLORS[id] ?? {
      icon: { bg: "#f1f5f9", text: "#475569" },
      selected: { bg: "#64748b", text: "#ffffff" },
    }
  );
}

export function StudentRegistrationOnboarding() {
  const { t } = useTranslation(["student", "common", "auth"]);
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("name");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyOptions, setHobbyOptions] = useState<string[]>([]);
  const [hobbyQuery, setHobbyQuery] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("USD");

  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStudentProfile(), getProfileCriteria()])
      .then(([profile, criteria]) => {
        if (cancelled) return;
        if (!needsStudentRegistrationOnboarding(profile)) {
          navigate("/student/dashboard", { replace: true });
          return;
        }
        setFirstName(String(profile.firstName ?? "").trim());
        setSelectedFaculties(profile.interestedFaculties ?? []);
        setHobbies(profile.hobbies ?? []);
        if (profile.budgetAmount != null)
          setBudgetAmount(String(profile.budgetAmount));
        if (profile.budgetCurrency) setBudgetCurrency(profile.budgetCurrency);
        setHobbyOptions(criteria.hobbies ?? []);
        if (!String(profile.firstName ?? "").trim()) setStep("name");
        else if (!profile.interestedFaculties?.length) setStep("faculty");
        else if (!profile.hobbies?.length) setStep("hobby");
        else setStep("budget");
      })
      .catch((err) => {
        if (!cancelled) toastApiError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const stepMeta = useMemo(
    () =>
      ({
        name: {
          icon: User,
          title: t("registrationOnboardingNameTitle", "What is your name?"),
          hint: t(
            "registrationOnboardingNameHint",
            "Enter your first name so universities know how to address you.",
          ),
        },
        faculty: {
          icon: BookOpen,
          title: t(
            "registrationOnboardingFacultyTitle",
            "Where do you want to study?",
          ),
          hint: t(
            "registrationOnboardingFacultyHint",
            "Choose one or more directions — medicine, IT, business, and more. Universities will see your choice.",
          ),
        },
        hobby: {
          icon: Heart,
          title: t(
            "registrationOnboardingHobbyTitle",
            "What are your hobbies?",
          ),
          hint: t(
            "registrationOnboardingHobbyHint",
            "Pick a few hobbies that describe you.",
          ),
        },
        budget: {
          icon: DollarSign,
          title: t(
            "registrationOnboardingBudgetTitle",
            "What is your study budget?",
          ),
          hint: t(
            "registrationOnboardingBudgetHint",
            "Enter how much you can spend per year (approximate).",
          ),
        },
      }) satisfies Record<
        Step,
        { icon: typeof User; title: string; hint: string }
      >,
    [t],
  );

  const validateStep = (): string | null => {
    if (step === "name") {
      if (!firstName.trim())
        return t(
          "registrationOnboardingNameRequired",
          "Please enter your name",
        );
    }
    if (step === "faculty") {
      if (selectedFaculties.length === 0) {
        return t(
          "registrationOnboardingFacultyRequired",
          "Select at least one direction",
        );
      }
    }
    if (step === "hobby") {
      if (hobbies.length === 0)
        return t(
          "registrationOnboardingHobbyRequired",
          "Select at least one hobby",
        );
    }
    if (step === "budget") {
      const amount = Number(budgetAmount);
      if (!budgetAmount.trim() || Number.isNaN(amount) || amount < 0) {
        return t(
          "registrationOnboardingBudgetRequired",
          "Enter your budget amount",
        );
      }
    }
    return null;
  };

  const goNext = () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else void finish();
  };

  const goSkip = () => {
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else void finish();
  };

  const finish = async () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const trimmedName = firstName.trim();
      const amount = Number(budgetAmount);
      await Promise.all([
        updateStudentProfile({
          firstName: trimmedName,
          interestedFaculties: selectedFaculties,
          hobbies,
          budgetAmount: amount,
          budgetCurrency: budgetCurrency.trim() || "USD",
        }),
        updateProfile({ name: trimmedName }),
      ]);
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.getState().setUser({ ...authUser, name: trimmedName });
      }
      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      toastApiError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          {t("common:loading", "Loading…")}
        </p>
      </div>
    );
  }

  const { icon: StepIcon, title, hint } = stepMeta[step];

  return (
    <div className="h-full flex items-center justify-center px-4 py-6 sm:py-10">
      <form
        className="w-full max-w-2xl h-full flex flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          goNext();
        }}
      >
        <Card className="overflow-hidden p-0 flex flex-col h-full">
          <div className="space-y-5 p-4 sm:p-6 overflow-y-auto flex-1">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-accent/12 text-primary-accent">
                <StepIcon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {hint}
                </p>
              </div>
            </div>

            {step === "name" ? (
              <Input
                label={t("firstName", "First name")}
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setError("");
                }}
                autoFocus
                autoComplete="given-name"
                placeholder={t(
                  "registrationOnboardingNamePlaceholder",
                  "Your name",
                )}
              />
            ) : null}

            {step === "faculty" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {FIELD_OF_STUDY.map((cat) => {
                  const selected = selectedFaculties.includes(cat.id);
                  const Icon = getFieldIcon(cat.id);
                  const fieldColors = getFieldStyle(cat.id);
                  const colors = selected
                    ? fieldColors.selected
                    : fieldColors.icon;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        setError("");
                        setSelectedFaculties((current) =>
                          current.includes(cat.id)
                            ? current.filter((value) => value !== cat.id)
                            : [...current, cat.id].slice(0, 5),
                        );
                      }}
                      className={cn(
                        "group flex flex-col items-center gap-3 rounded-2xl border p-3 text-center transition duration-200",
                        selected
                          ? "border-primary-accent/90 bg-primary-accent/15 shadow-lg shadow-primary-accent/10"
                          : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-primary-accent/30 hover:bg-primary-accent/5",
                      )}
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: colors.text }}
                          aria-hidden
                        />
                      </span>
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {t(cat.titleKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {step === "hobby" ? (
              <div className="space-y-4">
                <SearchableChipSelect
                  options={hobbyOptions}
                  value={hobbies}
                  onChange={(value) => {
                    setHobbies(value);
                    setError("");
                  }}
                  max={10}
                  query={hobbyQuery}
                  onQueryChange={(value) => setHobbyQuery(value)}
                  showCount={false}
                  placeholder={t("hobbiesPlaceholder", "Choose hobbies")}
                  searchPlaceholder={t(
                    "hobbiesSearchPlaceholder",
                    "Search hobbies",
                  )}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {hobbyOptions
                    .filter((option) => !hobbies.includes(option))
                    .filter(
                      (option) =>
                        !hobbyQuery.trim() ||
                        option
                          .toLowerCase()
                          .includes(hobbyQuery.trim().toLowerCase()),
                    )
                    .slice(0, 20)
                    .map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setError("");
                          setHobbies((current) =>
                            current.includes(option)
                              ? current
                              : [...current, option].slice(0, 10),
                          );
                        }}
                        className="group flex min-h-[56px] flex-col justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-center transition duration-200 hover:border-primary-accent/30 hover:bg-primary-accent/5"
                      >
                        <span className="text-sm font-semibold text-[var(--color-text)]">
                          {option}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            ) : null}

            {step === "budget" ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <Input
                  label={t("budgetAmount", "Budget per year")}
                  type="number"
                  min={0}
                  value={budgetAmount}
                  onChange={(e) => {
                    setBudgetAmount(e.target.value);
                    setError("");
                  }}
                  autoFocus
                  placeholder="5000"
                />
                <Select
                  label={t("budgetCurrency", "Currency")}
                  value={budgetCurrency}
                  onChange={(e) => setBudgetCurrency(e.target.value)}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                    { value: "UZS", label: "UZS" },
                    { value: "RUB", label: "RUB" },
                    { value: "TRY", label: "TRY" },
                    { value: "KZT", label: "KZT" },
                  ]}
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] p-4 sm:p-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={stepIndex === 0 || saving}
                onClick={() => {
                  setError("");
                  setStep(STEPS[Math.max(0, stepIndex - 1)]);
                }}
              >
                {t("common:back", "Back")}
              </Button>
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={goSkip}
                >
                  {t("common:skip", "Skip")}
                </Button>
              ) : null}
            </div>
            <Button type="submit" loading={saving} disabled={saving}>
              {step === "budget"
                ? t("registrationOnboardingFinish", "Go to my account")
                : t("common:next", "Next")}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
