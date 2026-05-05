import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageTitle } from "@/components/ui/PageTitle";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/auth";
import {
  getAdminCatalogUniversities,
  type AdminCatalogUniversity,
} from "@/services/admin";
import { setActAsUniversityUserId } from "@/constants/actAsUniversity";
import { getImageUrl } from "@/services/upload";
import type { User } from "@/types/user";

export function UniversityMultiManagerHome() {
  const { t } = useTranslation(["university", "common"]);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [, setMe] = useState<User | null>(user); // unused
  const [universities, setUniversities] = useState<AdminCatalogUniversity[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    getProfile()
      .then((u) => {
        setMe(u);
        setUser(u);
      })
      .catch(() => {
        setMe(null);
      })
      .finally(() => setLoading(false));
  }, [setUser]);

  useEffect(() => {
    setCatalogLoading(true);
    getAdminCatalogUniversities({
      limit: 100,
      search: search.trim() || undefined,
    })
      .then((res) => {
        setUniversities(res.data);
      })
      .catch(() => setUniversities([]))
      .finally(() => setCatalogLoading(false));
  }, [search]);

  const enterAs = (universityId: string) => {
    setActAsUniversityUserId(universityId);
    navigate("/university/dashboard");
  };

  const list = universities;

  return (
    <div className="mx-auto max-w-content w-full space-y-6 px-2 py-6 sm:px-4">
      <PageTitle
        title={t("university:multiManagerTitle", "Your universities")}
        icon="Building2"
      />
      <p className="text-sm text-[var(--color-text-muted)]">
        {t(
          "university:multiManagerIntro",
          "Choose a university to work in its dashboard. Your session uses that account until you leave the university area or clear the choice from your hub.",
        )}
      </p>

      <Input
        placeholder={t("common:search", "Search universities...")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading || catalogLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t("common:loading", "Loading…")}
        </p>
      ) : list.length === 0 ? (
        <Card className="border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
          {t("university:multiManagerNoUniversities", "No universities found.")}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((u) => (
            <Card
              key={u.id}
              className="flex flex-col gap-3 border border-[var(--color-border)] p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-center">
                  {u.logoUrl ? (
                    <img
                      src={getImageUrl(u.logoUrl)}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      U
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {u.name || u.universityName}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {(u.city || u.country) &&
                      `${u.city ? u.city + ", " : ""}${u.country || ""}`}
                  </p>
                </div>
              </div>
              <Button onClick={() => enterAs(u.id)}>
                {t("university:multiManagerOpen", "Open as this university")}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
