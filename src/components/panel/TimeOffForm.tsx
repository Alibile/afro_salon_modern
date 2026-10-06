"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { createTimeOff } from "@/actions/timeoff";
import { useActionError } from "@/lib/use-action-error";
import { useNewRecordClose } from "./NewRecordPanel";

export function TimeOffForm({ barbers, ownBarberId }: { barbers: { id: string; name: string }[] | null; ownBarberId: string | null }) {
  const t = useTranslations("panel.timeOff");
  const showError = useActionError();
  const closePanel = useNewRecordClose();
  const [allDay, setAllDay] = useState(true);
  const [pending, start] = useTransition();
  const router = useRouter();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); // YYYY-MM-DD
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => {
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
        closePanel();
      });
    }}>
      {barbers && (
        <Field id="barberId" label={t("barber")} className="sm:col-span-2">
          <Select id="barberId" name="barberId">
            {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Field>
      )}
      <Field id="date" label={t("date")}>
        <Input id="date" name="date" type="date" defaultValue={today} min={today} required />
      </Field>
      <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="size-4 accent-primary" /> {t("allDay")}
      </label>
      {!allDay && (
        <>
          <Field id="startTime" label={t("start")}>
            <Input id="startTime" name="startTime" type="time" required />
          </Field>
          <Field id="endTime" label={t("end")}>
            <Input id="endTime" name="endTime" type="time" required />
          </Field>
        </>
      )}
      <Field id="reason" label={t("reason")} className="sm:col-span-2">
        <Input id="reason" name="reason" maxLength={100} />
      </Field>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={pending}>{t("submit")}</Button>
      </div>
    </form>
  );
}
