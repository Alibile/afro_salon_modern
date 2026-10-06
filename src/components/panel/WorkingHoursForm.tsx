"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveWorkingHours } from "@/actions/barbers";
import { useActionError } from "@/lib/use-action-error";
import { weekdayName } from "@/lib/intl";

type Day = { dayOfWeek: number; isOff: boolean; startTime: string; endTime: string };

/**
 * Haftanın yedi günü: gün adı, açılış, kapanış ve "Kapalı" onay kutusu tek
 * satırda. Gün adları `Intl`den gelir, ana sayfadaki `weekdayName` ile ortak.
 */
export function WorkingHoursForm({ barberId, hours }: { barberId: string; hours: Day[] }) {
  const t = useTranslations("panel");
  const locale = useLocale();
  const showError = useActionError();
  const [days, setDays] = useState<Day[]>(hours);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (i: number, patch: Partial<Day>) => setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-[var(--radius)] border border-border">
        {days.map((d, i) => (
          <li key={d.dayOfWeek} className="grid grid-cols-[5.5rem_1fr_1fr_auto] items-center gap-3 px-3 py-2">
            <span className="text-sm font-medium">{weekdayName(d.dayOfWeek, locale)}</span>
            <Input type="time" aria-label={t("timeOff.start")} value={d.startTime} disabled={d.isOff} onChange={(e) => set(i, { startTime: e.target.value })} />
            <Input type="time" aria-label={t("timeOff.end")} value={d.endTime} disabled={d.isOff} onChange={(e) => set(i, { endTime: e.target.value })} />
            <label className="flex items-center gap-2 text-sm whitespace-nowrap">
              <input type="checkbox" checked={d.isOff} onChange={(e) => set(i, { isOff: e.target.checked })} className="size-4 accent-primary" /> {t("barbers.closed")}
            </label>
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Button disabled={pending} onClick={() => start(async () => {
          const r = await saveWorkingHours(barberId, { days });
          if (r.ok) { toast.success(t("barbers.hoursSaved")); router.refresh(); } else toast.error(showError(r));
        })}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
