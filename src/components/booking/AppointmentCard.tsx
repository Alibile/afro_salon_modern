import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopTime, shopDayDelta } from "@/lib/time";
import type { AppLocale } from "@/i18n/routing";
import type { AppointmentView } from "@/lib/queries/customer";
import { CancelButton } from "./CancelButton";

/**
 * Randevu kartı artık ileri tarihleri de gösteriyor (pencere: bugün + 6 gün),
 * bu yüzden tarih tek başına yetmiyor: en yakın iki gün adıyla değil
 * yakınlığıyla anılır ("Bugün", "Yarın"), ardından tam tarih durur. Fark
 * dükkanın takviminde ölçülür, saat farkıyla değil.
 */
export function AppointmentCard({ a, shopPhone, big = false }: { a: AppointmentView; shopPhone: string; big?: boolean }) {
  const t = useTranslations("booking");
  const locale = useLocale() as AppLocale;
  const delta = shopDayDelta(a.startsAt, new Date());
  const dayPrefix = delta === 0 ? t("today") : delta === 1 ? t("tomorrow") : null;
  return (
    <div className={big ? "border-l-4 border-primary bg-card p-5 shadow-none" : "border border-border bg-card p-4"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={big ? "display-md tabular-nums" : "font-display text-xl tracking-wide tabular-nums"}>{formatShopTime(a.startsAt)} – {formatShopTime(a.endsAt)}</p>
          <p className="editorial-note mt-1 text-sm text-muted-foreground">{dayPrefix ? `${dayPrefix} · ` : ""}{formatShopDate(a.startsAt, locale)}, {a.barberName}</p>
        </div>
        <Badge variant={a.status === "SCHEDULED" ? "default" : "secondary"}>{t(`status.${a.status}`)}</Badge>
      </div>
      <p className="mt-2 text-sm">{a.services.map((s) => s.name).join(", ")} · {formatKurus(a.totalKurus, locale)}</p>
      {a.status === "SCHEDULED" && (
        <div className="mt-3">
          {a.canCancel ? <CancelButton id={a.id} /> : <p className="text-sm text-muted-foreground">{t("cancelByPhone", { phone: shopPhone })}</p>}
        </div>
      )}
    </div>
  );
}
