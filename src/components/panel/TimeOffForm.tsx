"use client";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTimeOff } from "@/actions/timeoff";
import { useActionError } from "@/lib/use-action-error";

export function TimeOffForm({ barbers, ownBarberId }: { barbers: { id: string; name: string }[] | null; ownBarberId: string | null }) {
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
        toast.success(r.data.conflicts > 0 ? `İzin eklendi. Dikkat: ${r.data.conflicts} randevu bu aralıkla çakışıyor, müşterileri arayın.` : "İzin eklendi");
        router.refresh();
      });
    }}>
      {barbers && (
        <div className="sm:col-span-2">
          <Label htmlFor="barberId">Berber</Label>
          <select id="barberId" name="barberId" className="mt-1 w-full rounded-md border bg-background px-3 py-2">
            {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <div><Label htmlFor="date">Tarih</Label><Input id="date" name="date" type="date" defaultValue={today} min={today} required /></div>
      <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> Tüm gün</label>
      {!allDay && (
        <>
          <div><Label htmlFor="startTime">Başlangıç</Label><Input id="startTime" name="startTime" type="time" required /></div>
          <div><Label htmlFor="endTime">Bitiş</Label><Input id="endTime" name="endTime" type="time" required /></div>
        </>
      )}
      <div className="sm:col-span-2"><Label htmlFor="reason">Sebep (isteğe bağlı)</Label><Input id="reason" name="reason" maxLength={100} /></div>
      <Button type="submit" disabled={pending} className="sm:col-span-2">İzin ekle</Button>
    </form>
  );
}
