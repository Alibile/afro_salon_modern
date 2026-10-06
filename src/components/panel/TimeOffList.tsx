"use client";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTimeOff } from "@/actions/timeoff";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { useActionError } from "@/lib/use-action-error";
import type { AppLocale } from "@/i18n/routing";

type Item = { id: string; barberName: string; startsAt: Date; endsAt: Date; reason: string | null };

/** Yaklaşan izinler: berber, tarih ve saat aralığı ayrı satırlarda, sağda sil. */
export function TimeOffList({ items }: { items: Item[] }) {
  const t = useTranslations("panel");
  const locale = useLocale() as AppLocale;
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("timeOff.none")}</p>;
  return (
    <ul className="divide-y divide-border rounded-[var(--radius)] border border-border">
      {items.map((x) => (
        <li key={x.id} className="grid grid-cols-[1fr_auto] items-start gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-medium">{x.barberName}</p>
            <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
              <span>{formatShopDate(x.startsAt, locale)}</span>
              <span className="tabular-nums">{formatShopTime(x.startsAt)}–{formatShopTime(x.endsAt)}</span>
            </p>
            {x.reason && <p className="text-sm text-muted-foreground">{x.reason}</p>}
          </div>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => {
            const r = await deleteTimeOff(x.id);
            if (r.ok) { toast.success(t("timeOff.deleted")); router.refresh(); } else toast.error(showError(r));
          })}>{t("common.delete")}</Button>
        </li>
      ))}
    </ul>
  );
}
