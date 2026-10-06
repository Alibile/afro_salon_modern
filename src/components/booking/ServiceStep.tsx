"use client";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatKurus } from "@/lib/money";
import type { AppLocale } from "@/i18n/routing";

export type ServiceItem = { id: string; name: string; durationMinutes: number; priceKurus: number };

/**
 * Hizmet kartları: ad ve süre solda, fiyat sağda; seçili kart sol kenar
 * çizgisi ve onay işaretiyle. Yükseklik en az 56 px: telefonda rahat hedef.
 * Birden çok hizmet varsa altta "Devam": ziyaretçi birkaçını birlikte
 * seçebilir, adım ancak onun kararıyla kapanır. Tek hizmette ilk dokunuş
 * adımı kapatır (bkz. `servicesDoneAfterChange`); düğme yalnızca adım
 * "Değiştir" ile seçim dururken yeniden açıldığında görünür, yoksa ziyaretçi
 * aynı hizmeti kaldırıp yeniden seçmek zorunda kalırdı.
 */
export function ServiceStep({
  services,
  selectedIds,
  onChange,
  onContinue,
}: {
  services: ServiceItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onContinue: () => void;
}) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  return (
    <section data-step={1}>
      <h2 className="mb-3 text-xl font-medium">{t("step1")}</h2>
      <ul className="grid gap-2">
        {services.map((s) => {
          const on = selectedIds.includes(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={on}
                className={cn(
                  "grid min-h-14 w-full grid-cols-[1fr_auto] items-center gap-4 rounded-[var(--radius)] border bg-card px-4 py-3 text-left transition-colors",
                  on ? "border-primary border-l-4 bg-primary/5" : "border-border hover:border-foreground/40",
                )}
              >
                <span className="min-w-0">
                  <span className="block font-display text-lg">{s.name}</span>
                  <span className="text-sm text-muted-foreground">{tCommon("minutes", { count: s.durationMinutes })}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">
                  {formatKurus(s.priceKurus, locale)}
                  {on && <Check aria-hidden className="size-4 text-primary" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {(services.length > 1 || selectedIds.length > 0) && (
        <div className="mt-4 flex justify-end">
          <Button size="lg" disabled={selectedIds.length === 0} onClick={onContinue}>
            {t("continue")}
          </Button>
        </div>
      )}
    </section>
  );
}
