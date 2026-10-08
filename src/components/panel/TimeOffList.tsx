"use client";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTimeOff } from "@/actions/timeoff";
import { addMinutes, formatShopDate, formatShopTime, shopDateKey } from "@/lib/time";
import { useActionError } from "@/lib/use-action-error";
import type { AppLocale } from "@/i18n/routing";

type Item = { id: string; barberName: string; startsAt: Date; endsAt: Date; reason: string | null };

/**
 * Yaklaşan izinler: berber, tarih ve saat aralığı ayrı satırlarda, sağda sil.
 * Tüm gün izinde saat yazılmaz; birden çok güne yayılan izin iki tarihle
 * gösterilir (bitiş, dışlayıcı `endsAt`in bir önceki günü).
 */
function describe(x: Item, locale: AppLocale, allDayLabel: string): { dates: string; hours: string | null } {
  const lastInstant = addMinutes(x.endsAt, -1);
  const firstKey = shopDateKey(x.startsAt);
  const lastKey = shopDateKey(lastInstant);
  const allDay = formatShopTime(x.startsAt) === "00:00" && formatShopTime(x.endsAt) === "00:00";
  if (firstKey !== lastKey) return { dates: `${formatShopDate(x.startsAt, locale)} – ${formatShopDate(lastInstant, locale)}`, hours: allDay ? null : `${formatShopTime(x.startsAt)}–${formatShopTime(x.endsAt)}` };
  return { dates: formatShopDate(x.startsAt, locale), hours: allDay ? allDayLabel : `${formatShopTime(x.startsAt)}–${formatShopTime(x.endsAt)}` };
}

export function TimeOffList({ items }: { items: Item[] }) {
  const t = useTranslations("panel");
  const locale = useLocale() as AppLocale;
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("timeOff.none")}</p>;
  return (
    <ul className="divide-y divide-border rounded-[var(--radius)] border border-border">
      {items.map((x) => {
        const d = describe(x, locale, t("timeOff.allDay"));
        return (
        <li key={x.id} className="grid grid-cols-[1fr_auto] items-start gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-medium">{x.barberName}</p>
            <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
              <span>{d.dates}</span>
              {d.hours && <span className="tabular-nums">{d.hours}</span>}
            </p>
            {x.reason && <p className="text-sm text-muted-foreground">{x.reason}</p>}
          </div>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => {
            const r = await deleteTimeOff(x.id);
            if (r.ok) { toast.success(t("timeOff.deleted")); router.refresh(); } else toast.error(showError(r));
          })}>{t("common.delete")}</Button>
        </li>
        );
      })}
    </ul>
  );
}
