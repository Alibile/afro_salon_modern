"use client";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopTime } from "@/lib/time";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  serviceNames: string[];
  barberName: string | null;
  startsAt: string | null;
  totalMinutes: number;
  totalKurus: number;
  confirmLabel: string;
  disabled: boolean;
  onConfirm: () => void;
};

/**
 * Seçimlerin özeti ve onay düğmesi. Telefonda ekranın altına yapışık tek
 * çubuk (özet satırı + düğme); `md` ve üstünde sağ sütunda duran yapışkan
 * kart (üç satırlık liste + toplam + düğme). İkisi aynı öğedir, yalnızca
 * sınıflar değişir: sayfada tek bir onay düğmesi vardır.
 */
export function BookingSummary({ serviceNames, barberName, startsAt, totalMinutes, totalKurus, confirmLabel, disabled, onConfirm }: Props) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const when = startsAt ? `${formatShopDate(new Date(startsAt), locale)}, ${formatShopTime(new Date(startsAt))}` : null;
  const rows: { key: "step1" | "step2" | "step3"; value: string | null }[] = [
    { key: "step1", value: serviceNames.length ? serviceNames.join(", ") : null },
    { key: "step2", value: barberName },
    { key: "step3", value: when },
  ];
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur md:sticky md:top-24 md:z-auto md:border md:bg-background md:p-5 md:backdrop-blur-none">
      <h2 className="hidden text-lg font-medium md:block">{t("summaryTitle")}</h2>
      <dl className="hidden md:mt-4 md:block md:divide-y md:divide-border">
        {rows.map((r) => (
          <div key={r.key} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="shrink-0 text-muted-foreground">{t(r.key)}</dt>
            <dd className={r.value ? "text-right" : "text-right text-muted-foreground"}>{r.value ?? t("notChosen")}</dd>
          </div>
        ))}
      </dl>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm md:mt-4 md:mb-4 md:border-t md:border-border md:pt-4">
        <span className="min-w-0 truncate text-muted-foreground md:hidden">{serviceNames.join(", ")}</span>
        <span className="hidden text-muted-foreground md:inline">{tCommon("minutes", { count: totalMinutes })}</span>
        <span className="flex shrink-0 gap-3 font-medium tabular-nums">
          <span className="md:hidden">{tCommon("minutesShort", { count: totalMinutes })}</span>
          <span>{formatKurus(totalKurus, locale)}</span>
        </span>
      </div>
      <Button size="lg" className="w-full" disabled={disabled} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  );
}
