"use client";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatKurus } from "@/lib/money";
import type { AppLocale } from "@/i18n/routing";

export type ServiceItem = { id: string; name: string; durationMinutes: number; priceKurus: number };

export function ServiceStep({ services, selectedIds, onChange }: { services: ServiceItem[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  return (
    <section>
      <h2 className="display-md mb-4">{t("step1")}</h2>
      <ul className="grid gap-2">
        {services.map((s) => {
          const on = selectedIds.includes(s.id);
          return (
            <li key={s.id}>
              <button type="button" onClick={() => toggle(s.id)} aria-pressed={on}
                className={cn("flex w-full items-center justify-between gap-3 border border-border bg-card px-4 py-3.5 text-left transition-colors", on ? "border-primary bg-primary/5" : "hover:border-foreground/40")}>
                <span className="min-w-0">
                  <span className="block font-display text-xl tracking-wide">{s.name}</span>
                  <span className="editorial-note text-sm text-muted-foreground">{tCommon("minutes", { count: s.durationMinutes })}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">{formatKurus(s.priceKurus, locale)} {on && <Check className="size-4 text-primary" />}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
