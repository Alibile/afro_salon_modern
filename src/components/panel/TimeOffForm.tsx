"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTimeOff } from "@/actions/timeoff";
import { useActionError } from "@/lib/use-action-error";

export function TimeOffForm({ barbers, ownBarberId }: { barbers: { id: string; name: string }[] | null; ownBarberId: string | null }) {
  const t = useTranslations("panel.timeOff");
  const showError = useActionError();
  const [allDay, setAllDay] = useState(true);
  const [pending, start] = useTransition();
  const router = useRouter();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); // YYYY-MM-DD
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await createTimeOff({
          barberId: String(fd.get("barberId") ?? ownBarberId ?? ""),
          date: String(fd.get("date")),
          allDay,
          startTime: allDay ? undefined : String(fd.get("startTime")),
          endTime: allDay ? undefined : String(fd.get("endTime")),
          reason: String(fd.get("reason") ?? ""),
        });
        if (!r.ok) { toast.error(showError(r)); return; }
        toast.success(r.data.conflicts > 0 ? t("addedWithConflicts", { count: r.data.conflicts }) : t("added"));
        router.refresh();
      });
    }}>
      {barbers && (
        <div className="sm:col-span-2">
          <Label htmlFor="barberId">{t("barber")}</Label>
          <select id="barberId" name="barberId" className="mt-1 w-full rounded-md border bg-background px-3 py-2">
            {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <div><Label htmlFor="date">{t("date")}</Label><Input id="date" name="date" type="date" defaultValue={today} min={today} required /></div>
      <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> {t("allDay")}</label>
      {!allDay && (
        <>
          <div><Label htmlFor="startTime">{t("start")}</Label><Input id="startTime" name="startTime" type="time" required /></div>
          <div><Label htmlFor="endTime">{t("end")}</Label><Input id="endTime" name="endTime" type="time" required /></div>
        </>
      )}
      <div className="sm:col-span-2"><Label htmlFor="reason">{t("reason")}</Label><Input id="reason" name="reason" maxLength={100} /></div>
      <Button type="submit" disabled={pending} className="sm:col-span-2">{t("submit")}</Button>
    </form>
  );
}
