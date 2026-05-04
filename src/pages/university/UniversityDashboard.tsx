 import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageTitle } from "@/components/ui/PageTitle";
import { Badge } from "@/components/ui/Badge";
import {
  getDashboard,
  type UniversityDashboardData,
} from "@/services/university";
import { toastApiError } from "@/utils/toastError";
import {
  ArrowRight,
  BarChart3,
  Bot,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { pickStudentProfileId } from "@/utils/mongoId";
import { getStudentDisplayName } from "@/utils/studentDisplay";
import { MiniAreaAnalyticsCard } from "@/components/analytics/MiniAreaAnalyticsCard";

const STAGE_LABELS: Record<string, string> = {
  interested: "pipelineInterested",
  under_review: "pipelineEvaluating",
  chat_opened: "pipelineContacted",
  offer_sent: "pipelineOfferSent",
  rejected: "pipelineRejected",
  accepted: "pipelineAccepted",
};

export function UniversityDashboard() {
  const { t } = useTranslation(["common", "university"]);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<UniversityDashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((e) => {
        toastApiError(e);
        setDashboard(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const pipeline = dashboard?.pipeline ?? [];
  const interestedCount = dashboard?.interestedCount ?? 0;
  const chatCount = dashboard?.chatCount ?? 0;
  const offerSentCount =
    (dashboard?.offerSentCount ?? 0) + (dashboard?.pendingOffers ?? 0);
  const acceptanceRate = dashboard?.acceptanceRate ?? 0;
  const totalInterests = dashboard?.totalInterests ?? 0;
  const topRecs = dashboard?.topRecommendations ?? [];
  const analyticsSeriesByRange = {
    "12h": pipeline.map((p) => Math.max(0, Math.round((p._count ?? 0) * 0.72))),
    "24h": pipeline.map((p) => p._count ?? 0),
    "7d": pipeline.map((p, index) =>
      Math.max(0, Math.round((p._count ?? 0) * (1.08 + index * 0.03))),
    ),
  };
  const nextAction = !dashboard?.verified
    ? {
        title: t(
          "university:dashboardVerifyTitle",
          "Finish verification to build trust",
        ),
        description: t(
          "university:dashboardVerifyHint",
          "Verified universities look more reliable to students and can move faster through the funnel.",
        ),
        to: "/university/profile",
      }
    : interestedCount === 0
      ? {
          title: t(
            "university:dashboardDiscoveryTitle",
            "Add discovery momentum",
          ),
          description: t(
            "university:dashboardDiscoveryHint",
            "Review recommended students and refine your profile so more students can find your institution.",
          ),
          to: "/university/students",
        }
      : {
          title: t(
            "university:dashboardPipelineTitle",
            "Work the warmest leads first",
          ),
          description: t(
            "university:dashboardPipelineHint",
            "Reply quickly to interested students and move them into chat or offer stages while they are active.",
          ),
          to: "/university/pipeline",
        };

  return (
    <div className="space-y-6 pb-page-bottom-cta">
      <div
        className="flex flex-wrap items-center gap-2"
        data-onboarding="university-dashboard-overview"
      >
        <PageTitle
          title={t("university:dashboard", "Dashboard")}
          icon="LayoutDashboard"
        />
      </div>

      <section className="grid gap-4 rounded-card border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(224,242,254,0.82))] p-5 shadow-[var(--shadow-card)] dark:bg-[linear-gradient(135deg,rgba(17,24,39,0.98),rgba(8,47,73,0.94))] lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.95fr)] lg:items-start sm:p-7">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={dashboard?.verified ? "success" : "default"}
              className="inline-flex items-center gap-1"
            >
              {dashboard?.verified ? (
                <ShieldCheck size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              {dashboard?.verified
                ? t("university:verifiedStatus", "Verified and visible")
                : t(
                    "university:verificationPending",
                    "Verification in progress",
                  )}
            </Badge>
            <Badge variant="default">
              {t("university:newInterests", "New interests")}:{" "}
              {loading ? "—" : interestedCount}
            </Badge>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">
              {t(
                "university:dashboardHeroTitle",
                "Keep recruitment clear, fast, and easy to act on",
              )}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t(
                "university:dashboardHeroHint",
                "This space is organized around the actions that matter most for university teams: discover students, answer faster, and convert interest into offers.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to="/university/students">
              {t("university:navDiscovery")}
            </Button>
            <Button to="/university/pipeline" variant="secondary">
              {t("university:navPipeline")}
            </Button>
            <Button to="/university/chat" variant="ghost">
              {t("university:activeChats", "Active chats")}
            </Button>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/60 bg-[var(--color-card)]/88 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {t("university:nextBestAction", "Next best action")}
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">
            {nextAction.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {nextAction.description}
          </p>
          <Link
            to={nextAction.to}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-primary-accent hover:underline"
          >
            {t("university:openTask", "Open task")}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/university/pipeline">
          <Card
            className="h-full cursor-pointer hover:border-primary-accent transition-colors"
            interactive
          >
            <CardTitle className="flex items-center gap-2">
              <Users size={18} />{" "}
              {t("university:newInterests", "New interests")}
            </CardTitle>
            <p className="text-2xl font-semibold mt-1">
              {loading ? "—" : interestedCount}
            </p>
<p className="text-sm text-[var(--color-text-muted)]">
              {t('university:total')}: {loading ? "—" : totalInterests}
            </p>
          </Card>
        </Link>
        <Link to="/university/chat">
          <Card
            className="h-full cursor-pointer hover:border-primary-accent transition-colors"
            interactive
          >
            <CardTitle className="flex items-center gap-2">
              <MessageCircle size={18} />{" "}
              {t("university:activeChats", "Active chats")}
            </CardTitle>
            <p className="text-2xl font-semibold mt-1">
              {loading ? "—" : chatCount}
            </p>
          </Card>
        </Link>
        <Link to="/university/pipeline">
          <Card
            className="h-full cursor-pointer hover:border-primary-accent transition-colors"
            interactive
          >
            <CardTitle className="flex items-center gap-2">
              <Send size={18} /> {t("university:offersSent", "Offers sent")}
            </CardTitle>
            <p className="text-2xl font-semibold mt-1">
              {loading ? "—" : offerSentCount}
            </p>
          </Card>
        </Link>
        <Link to="/university/analytics">
          <Card
            className="h-full cursor-pointer hover:border-primary-accent transition-colors"
            interactive
          >
            <CardTitle>
              {t("university:acceptanceRate", "Acceptance rate")}
            </CardTitle>
            <p className="text-2xl font-semibold mt-1">
              {loading ? "—" : `${acceptanceRate}%`}
            </p>
          </Card>
        </Link>
      </div>

      {pipeline.length > 0 ? (
        <MiniAreaAnalyticsCard
          title={t(
            "university:dashboardMiniAnalyticsTitle",
            "Pipeline momentum",
          )}
          value={String(totalInterests)}
          delta={t(
            "university:dashboardMiniAnalyticsDelta",
            "active interested students",
          )}
          categories={pipeline.map((p) => STAGE_LABELS[p.status] ?? p.status)}
          seriesByRange={analyticsSeriesByRange}
          metricOneLabel={t("university:activeChats", "Active chats")}
          metricOneValue={String(chatCount)}
          metricTwoLabel={t("university:offersSent", "Offers sent")}
          metricTwoValue={String(offerSentCount)}
        />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link to="/university/pipeline">
          <Card
            className="h-full cursor-pointer hover:border-primary-accent transition-colors"
            interactive
          >
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} />{" "}
              {t("university:pipelineFunnel", "Pipeline")}
            </CardTitle>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Interested → Contacted → Evaluating → Offer Sent → Accepted
            </p>
            <ul className="mt-3 space-y-2">
              {pipeline.length === 0 && !loading && (
                <li className="text-[var(--color-text-muted)]">No data yet.</li>
              )}
              {pipeline.map((p) => (
                <li
                  key={p.status}
                  className="flex justify-between items-center text-sm"
                >
                  <span>{STAGE_LABELS[p.status] ?? p.status}</span>
                  <span className="font-medium">{p._count ?? 0}</span>
                </li>
              ))}
            </ul>
            <span className="inline-block mt-3 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">
              {t("university:viewAnalytics", "Full analytics")}
            </span>
          </Card>
        </Link>

        <Link to="/university/students">
          <Card
            className="h-full cursor-pointer hover:border-primary-accent transition-colors"
            interactive
          >
            <CardTitle>
              {t("university:topRecommendations", "Top recommended students")}
            </CardTitle>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Best match score
            </p>
            {loading ? (
              <p className="text-[var(--color-text-muted)] mt-2 text-sm">
                Loading…
              </p>
            ) : topRecs.length === 0 ? (
              <p className="text-[var(--color-text-muted)] mt-2 text-sm">
                No recommendations yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {topRecs.slice(0, 5).map((r) => {
                  const st = r.student;
                  const name = getStudentDisplayName(
                    st,
                    t("university:studentLabel", "Student"),
                  );
                  const studentId = pickStudentProfileId({
                    studentProfileId: r.studentProfileId,
                    student: st,
                  });
                  const canOpenProfile = Boolean(studentId);
                  return (
                    <li
                      key={r.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>{name}</span>
                      <span className="text-[var(--color-text-muted)]">
                        {r.matchScore != null ? `${r.matchScore}%` : ""}{" "}
                        {st?.country ?? ""}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!canOpenProfile) return;
                          navigate(`/university/students/${studentId}`);
                        }}
                        disabled={!canOpenProfile}
                        className="text-sm text-primary-accent hover:underline disabled:pointer-events-none disabled:text-[var(--color-text-muted)] disabled:no-underline"
                      >
                        Profile
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <span className="inline-block mt-3 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">
              {t("university:navDiscovery")}
            </span>
          </Card>
        </Link>
      </div>

      <Card className="border-primary-accent/20 bg-primary-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Bot size={18} /> {t("common:edmissionAi")}
        </CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t("university:aiHelperText")}
        </p>
        <Button to="/university/ai" className="mt-3" icon={<Bot size={16} />}>
          {t("university:openEdmissionAi")}
        </Button>
      </Card>
    </div>
  );
}
