"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/actions/settings";
import type { SettingsInput } from "@/schemas/settings";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="grid gap-3 rounded-xl border bg-card p-4" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await updateSettings({
          shopName: String(fd.get("shopName")), address: String(fd.get("address")), phone: String(fd.get("phone")),
          cancellationWindowMinutes: Number(fd.get("cancellationWindowMinutes")), minLeadMinutes: Number(fd.get("minLeadMinutes")),
          slotStepMinutes: Number(fd.get("slotStepMinutes")), notifyBarberOnBooking: fd.get("notifyBarberOnBooking") === "on",
        });
        if (!r.ok) { setError(r.error); return; }
        setError(null); toast.success("Ayarlar kaydedildi");
      });
    }}>
      <div><Label htmlFor="shopName">Dükkan adı</Label><Input id="shopName" name="shopName" defaultValue={initial.shopName} required /></div>
      <div><Label htmlFor="address">Adres</Label><Input id="address" name="address" defaultValue={initial.address} /></div>
      <div><Label htmlFor="phone">Telefon</Label><Input id="phone" name="phone" defaultValue={initial.phone} /></div>
      <div><Label htmlFor="cancellationWindowMinutes">Müşteri iptal sınırı (dk)</Label><Input id="cancellationWindowMinutes" name="cancellationWindowMinutes" type="number" min={0} max={1440} defaultValue={initial.cancellationWindowMinutes} /></div>
      <div><Label htmlFor="minLeadMinutes">En erken randevu (şu andan itibaren, dk)</Label><Input id="minLeadMinutes" name="minLeadMinutes" type="number" min={0} max={240} defaultValue={initial.minLeadMinutes} /></div>
      <div>
        <Label htmlFor="slotStepMinutes">Slot adımı (dk)</Label>
        <select id="slotStepMinutes" name="slotStepMinutes" defaultValue={initial.slotStepMinutes} className="mt-1 w-full rounded-md border bg-background px-3 py-2">
          {[5, 10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notifyBarberOnBooking" defaultChecked={initial.notifyBarberOnBooking} /> Yeni randevuda berbere e-posta gönder</label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>Kaydet</Button>
    </form>
  );
}
