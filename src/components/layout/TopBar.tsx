import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logout as logoutApi } from "@/services/auth";
import { useSocket } from "@/hooks/useSocket";
import { useNotificationStore } from "@/store/notificationStore";
import { buildNotificationLink } from "@/services/notifications";
import { Button } from "@/components/ui/Button";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { LanguageMenu } from "./LanguageMenu";
import { GlobalSearch } from "./GlobalSearch";
import { MobileSearch } from "./MobileSearch";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { BrandLogo } from "./BrandLogo";
import { cn } from "@/utils/cn";
import { toastApiError } from "@/utils/toastError";
import { DEFAULT_USER_AVATAR, getImageUrl } from "@/services/upload";
import { getDashboardPath } from "@/utils/dashboardPath";
import { notifyInfo } from "@/utils/notify";
import { useUIStore } from "@/store/uiStore";

/** lg+ sidebar is visible: TopBar sits only above the main column (no logo here — brand is in the sidebar). */
const MAIN_LAYOUT_SIDEBAR_PATHS = [
  "/profile",
  "/notifications",
  "/payment",
  "/payment/success",
  "/payment/cancel",
  "/support",
] as const;

function desktopTopBarBesideSidebar(pathname: string): boolean {
  if (pathname.startsWith("/search")) return false;
  if (
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/university" ||
    pathname.startsWith("/university/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/school" ||
    pathname.startsWith("/school/")
  ) {
    return true;
  }
  return (
    MAIN_LAYOUT_SIDEBAR_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/support/")
  );
}

export function TopBar() {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const role = (user as { role?: string })?.role ?? null;
  const dashboardPath = getDashboardPath(user);
  const { onNotification } = useSocket();
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatar]);

  useEffect(() => {
    const unsubscribe = onNotification((payload) => {
      const computedLink = buildNotificationLink(
        payload.type ?? "info",
        payload.referenceId,
        payload.metadata,
        role as import("@/types/user").Role,
      );
      const link = computedLink ?? payload.link;
      addNotification({
        id: payload.id,
        type: payload.type as import("@/store/notificationStore").NotificationType,
        title: payload.title,
        body: payload.body,
        link,
        referenceId: payload.referenceId,
        metadata: payload.metadata,
        createdAt: payload.createdAt ?? new Date().toISOString(),
      });

      if (!document.hidden) {
        const title = (
          payload.title ||
          payload.body ||
          t("notifications")
        ).trim();
        const description =
          payload.title &&
          payload.body &&
          payload.body.trim() !== payload.title.trim()
            ? payload.body
            : undefined;
        if (title) {
          notifyInfo(title, {
            description,
            duration: 6500,
            action: link
              ? {
                  label: t("toastOpenNotification", "Open"),
                  onClick: () => {
                    window.location.assign(link);
                  },
                }
              : undefined,
          });
        }
      }

      // Browser notification when tab is in background
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        document.hidden
      ) {
        if (Notification.permission === "granted") {
          const n = new Notification(payload.title ?? "Edmission", {
            body: payload.body ?? "",
            icon: "/favicon.svg",
          });
          n.onclick = () => {
            window.focus();
            if (link) window.location.href = link;
            n.close();
          };
        }
      }
    });
    return unsubscribe;
  }, [onNotification, addNotification, role]);

  const hideOnMobileSearch = pathname === "/search";
  const besideSidebar = desktopTopBarBesideSidebar(pathname);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 box-border flex min-h-16 flex-col overflow-visible border-b border-[var(--color-border)] bg-[var(--color-card)] px-3 sm:px-4 lg:h-16 lg:min-h-0 lg:shrink-0",
          "right-0 transition-[left] duration-200 ease-out",
          "left-0",
          besideSidebar &&
            (sidebarCollapsed ? "lg:left-[72px]" : "lg:left-[260px]"),
          hideOnMobileSearch && "max-md:hidden",
        )}
      >
        {/* Desktop: beside sidebar — no logo (screenshot layout); full-width routes keep logo. */}
        <div
          className={cn(
            "hidden min-h-0 w-full flex-1 items-center gap-2 md:flex lg:min-h-0",
            besideSidebar ? "justify-between" : "justify-between",
          )}
        >
          {besideSidebar ? (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] transition-colors hover:border-primary-accent/40 hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent lg:inline-flex"
                aria-label={
                  sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")
                }
                title={
                  sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")
                }
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4.5 w-4.5" />
                ) : (
                  <PanelLeftClose className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          ) : null}
          {!besideSidebar && (
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <Link
                to={dashboardPath}
                className="rounded-md px-1 py-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
                aria-label={t("appName")}
              >
                <BrandLogo imageClassName="h-9 w-auto" />
              </Link>
            </div>
          )}
          <div
            className={cn(
              "flex min-w-0 items-center gap-2 sm:gap-3 justify-end",
              !besideSidebar && "flex-1",
            )}
          >
            <div className="flex shrink-0 items-center">
              <GlobalSearch />
            </div>
            <NotificationsDropdown />
            <div
              className="flex min-[0px]:gap-1.5 items-center gap-2 border-l border-[var(--color-border)] pl-2 sm:pl-3"
              aria-label={t("language")}
            >
              <LanguageMenu />
              <ThemeSwitch />
            </div>
            <Link
              to="/profile"
              className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-primary-accent/50 transition-colors"
              aria-label={user?.name || user?.email || t("profile")}
            >
              {user?.avatar && !avatarLoadError ? (
                <img
                  src={getImageUrl(user.avatar)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <img
                  src={DEFAULT_USER_AVATAR}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => logoutApi().catch(toastApiError)}
            >
              {t("logout")}
            </Button>
            <MobileNavDrawer />
          </div>
        </div>

        {/* Mobile: иконка поиска ведёт на /search (полноэкранная страница) */}
        <div className="flex min-h-16 w-full flex-1 items-center gap-2 py-1.5 md:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              to={dashboardPath}
              className="flex min-w-0 flex-1 items-center rounded-lg py-0.5 pr-1 transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent sm:hidden"
              aria-label={t("appName")}
            >
              <BrandLogo imageClassName="h-8 w-auto max-w-[156px]" />
            </Link>
            <Link
              to={dashboardPath}
              className="hidden sm:flex min-w-0 flex-1 rounded-md px-1 py-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
              aria-label={t("appName")}
            >
              <BrandLogo imageClassName="h-9 w-auto" />
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <MobileSearch />
            <NotificationsDropdown />
            <Link
              to="/profile"
              className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-primary-accent/50 transition-colors"
              aria-label={user?.name || user?.email || t("profile")}
            >
              {user?.avatar && !avatarLoadError ? (
                <img
                  src={getImageUrl(user.avatar)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <img
                  src={DEFAULT_USER_AVATAR}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </Link>
            <MobileNavDrawer />
          </div>
        </div>
      </header>
      {/* Reserve space for fixed header; on lg beside sidebar the column gets lg:pt-16 instead */}
      <div
        className={cn(
          "pointer-events-none h-16 shrink-0",
          hideOnMobileSearch && "max-md:hidden",
          besideSidebar && "lg:h-0",
        )}
        aria-hidden
      />
    </>
  );
}
