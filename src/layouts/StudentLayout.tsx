import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";
import { useUIStore } from "@/store/uiStore";
import { useMobileMenuStore } from "@/store/mobileMenuStore";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { RoleOnboardingController } from "@/components/onboarding/RoleOnboardingController";
import { cn } from "@/utils/cn";
import { ContentFallback } from "@/components/layout/ContentFallback";
import { buildStudentNavigation } from "@/navigation/studentNav";
import { getStudentProfile } from "@/services/student";
import { needsStudentRegistrationOnboarding } from "@/utils/studentRegistrationOnboarding";

export function StudentLayout() {
  const { t } = useTranslation("student");
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const setNavItems = useMobileMenuStore((s) => s.setNavItems);
  const educationStatus = user?.studentProfile?.educationStatus;
  const counsellorLinked = Boolean(
    (user?.studentProfile as { counsellorUserId?: string } | undefined)
      ?.counsellorUserId,
  );
  const showMySchools =
    (educationStatus === "in_school" ||
      educationStatus === "finished_school") &&
    !counsellorLinked;

  const isOnboardingPage = location.pathname === "/student/onboarding";
  const isChatPage = location.pathname === "/student/chat";
  const isFixedHeightPage = location.pathname === "/student/ai" || isChatPage;

  const { bottomNavItems, sidebarItems, sidebarBottomItems, mobileMenuItems } =
    useMemo(
      () =>
        buildStudentNavigation(
          (key, defaultValue) => t(key, { defaultValue: defaultValue ?? key }),
          { showMySchools },
        ),
      [t, showMySchools],
    );

  useEffect(() => {
    setNavItems(mobileMenuItems);
    return () => setNavItems(null);
  }, [mobileMenuItems, setNavItems]);

  useEffect(() => {
    if (location.pathname === "/student/onboarding") return;
    let cancelled = false;
    getStudentProfile()
      .then((profile) => {
        if (cancelled) return;
        if (needsStudentRegistrationOnboarding(profile)) {
          navigate("/student/onboarding", { replace: true });
        }
      })
      .catch(() => {
        /* profile fetch errors handled on target page */
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1">
      {!isOnboardingPage ? <RoleOnboardingController role="student" /> : null}
      {!isOnboardingPage ? (
        <Sidebar items={sidebarItems} bottomItems={sidebarBottomItems} />
      ) : null}
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col transition-[margin-left] duration-200",
          isFixedHeightPage
            ? "h-[100dvh] max-h-[100dvh] overflow-hidden pb-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:pt-16"
            : "h-full pb-mobile-nav lg:pt-16",
          !isOnboardingPage && (collapsed ? "lg:ml-[72px]" : "lg:ml-sidebar"),
          isOnboardingPage && "min-h-[100dvh] justify-center lg:pt-0 pb-0",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-col",
            !isOnboardingPage && "animate-page-enter",
            isChatPage
              ? "h-full min-h-0 flex-1 max-w-none overflow-hidden px-0 sm:px-0"
              : "max-w-content px-2 sm:px-4",
            isFixedHeightPage
              ? "h-full min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1",
          )}
        >
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      {!isOnboardingPage ? <BottomNav items={bottomNavItems} /> : null}
    </div>
  );
}
