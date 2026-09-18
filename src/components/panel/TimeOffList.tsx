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

export function TimeOffList({ items }: { items: Item[] }) {
  const t = useTranslations("panel");
  const locale = useLocale() as AppLocale;
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();
  if (items.length === 0) return <p className="text-muted-foreground">{t("timeOff.none")}</p>;
  return (
    <ul className="space-y-2">
      {items.map((x) => (
        <li key={x.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
          <div>
            <p className="font-medium">{x.barberName}</p>
            <p className="text-sm text-muted-foreground">{formatShopDate(x.startsAt, locale)} · {formatShopTime(x.startsAt)}–{formatShopTime(x.endsAt)} {x.reason && `· ${x.reason}`}</p>
          </div>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => {
            const r = await deleteTimeOff(x.id);
            if (r.ok) { toast.success(t("timeOff.deleted")); router.refresh(); } else toast.error(showError(r));
          })}>{t("common.delete")}</Button>
        </li>
      ))}
    </ul>
  );
}
