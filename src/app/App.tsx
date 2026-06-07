import { useEffect } from "react";
import { AppVersionCorner } from "@/components/AppVersionCorner";
import { TelegramAuthAutoLoginWatcher } from "@/components/auth/TelegramAuthAutoLoginWatcher";
import { applyTelegramWebAppBranding } from "@/services/telegramWebApp";
import { Router } from "./Router";

export function App() {
  useEffect(() => {
    applyTelegramWebAppBranding();
  }, []);

  return (
    <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <Router />
      <TelegramAuthAutoLoginWatcher />
      <AppVersionCorner />
    </div>
  );
}
