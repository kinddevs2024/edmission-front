import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

type SearchableChipSelectProps = {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  query?: string;
  onQueryChange?: (query: string) => void;
  showCount?: boolean;
};

export function SearchableChipSelect({
  options,
  value,
  onChange,
  max = 10,
  placeholder,
  searchPlaceholder,
  className,
  query,
  onQueryChange,
  showCount = true,
}: SearchableChipSelectProps) {
  const { t } = useTranslation("common");
  const [internalQuery, setInternalQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const effectiveQuery = query ?? internalQuery;

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = effectiveQuery.trim().toLowerCase();
    return options
      .filter((opt) => !selectedSet.has(opt))
      .filter((opt) => !q || opt.toLowerCase().includes(q))
      .slice(0, 25);
  }, [options, effectiveQuery, selectedSet]);

  const add = (item: string) => {
    if (selectedSet.has(item) || value.length >= max) return;
    onChange([...value, item]);
    if (onQueryChange) onQueryChange("");
    else setInternalQuery("");
    setOpen(false);
  };

  const remove = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  return (
    <div ref={containerRef} className={cn("space-y-3", className)}>
      <div className="relative">
        <input
          type="text"
          value={effectiveQuery}
          onChange={(e) => {
            const next = e.target.value;
            if (onQueryChange) onQueryChange(next);
            else setInternalQuery(next);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder={
            searchPlaceholder ?? placeholder ?? t("search", "Search…")
          }
          autoComplete="off"
          className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2.5 text-sm text-[var(--color-text)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_2px_0_0_rgba(0,0,0,0.05)] focus:border-primary-accent focus:outline-none focus:ring-4 focus:ring-primary-accent/15"
        />
        {open && filtered.length > 0 ? (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-lg"
          >
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full px-3 py-2.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/35"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(opt)}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && effectiveQuery.trim() && filtered.length === 0 ? (
          <p className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm text-[var(--color-text-muted)] shadow-lg">
            {t("noResults", "No results")}
          </p>
        ) : null}
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-accent/30 bg-primary-accent/12 px-3 py-1 text-sm text-[var(--color-text)]"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                className="rounded-full p-0.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-text)]"
                aria-label={t("remove", "Remove")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : placeholder ? (
        <p className="text-sm text-[var(--color-text-muted)]">{placeholder}</p>
      ) : null}

      {showCount && max > 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          {value.length} / {max}
        </p>
      ) : null}
    </div>
  );
}
