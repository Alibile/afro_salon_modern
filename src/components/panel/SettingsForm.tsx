"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSettings } from "@/actions/settings";
import type { SettingsInput } from "@/schemas/settings";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await updateSettings({
            shopName: String(fd.get("shopName")),
            address: String(fd.get("address")),
            phone: String(fd.get("phone")),
            cancellationWindowMinutes: Number(fd.get("cancellationWindowMinutes")),
            minLeadMinutes: Number(fd.get("minLeadMinutes")),
            slotStepMinutes: Number(fd.get("slotStepMinutes")),
            notifyBarberOnBooking: fd.get("notifyBarberOnBooking") === "on",
            email: String(fd.get("email")),
            instagram: String(fd.get("instagram")),
            facebook: String(fd.get("facebook")),
            whatsapp: String(fd.get("whatsapp")),
            mapsUrl: String(fd.get("mapsUrl")),
            aboutTitle: String(fd.get("aboutTitle")),
            aboutText: String(fd.get("aboutText")),
            whyUs1Title: String(fd.get("whyUs1Title")),
            whyUs1Text: String(fd.get("whyUs1Text")),
            whyUs2Title: String(fd.get("whyUs2Title")),
            whyUs2Text: String(fd.get("whyUs2Text")),
            whyUs3Title: String(fd.get("whyUs3Title")),
            whyUs3Text: String(fd.get("whyUs3Text")),
            satisfactionPercent: Number(fd.get("satisfactionPercent")),
            yearsExperience: Number(fd.get("yearsExperience")),
          });
          if (!r.ok) { setError(r.error); return; }
          setError(null); toast.success("Ayarlar kaydedildi");
        });
      }}
    >
      <fieldset className="grid gap-3 rounded-xl border bg-card p-4">
        <legend className="px-1 text-lg font-medium">Dükkan</legend>
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
      </fieldset>

      <fieldset className="grid gap-3 rounded-xl border bg-card p-4">
        <legend className="px-1 text-lg font-medium">Site içeriği</legend>
        <div><Label htmlFor="email">E-posta</Label><Input id="email" name="email" type="email" defaultValue={initial.email} /></div>
        <div><Label htmlFor="instagram">Instagram</Label><Input id="instagram" name="instagram" placeholder="@kullaniciadi veya URL" defaultValue={initial.instagram} /></div>
        <div><Label htmlFor="facebook">Facebook</Label><Input id="facebook" name="facebook" placeholder="https://facebook.com/..." defaultValue={initial.facebook} /></div>
        <div><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" name="whatsapp" placeholder="905551112233" defaultValue={initial.whatsapp} /></div>
        <div><Label htmlFor="mapsUrl">Harita adresi</Label><Input id="mapsUrl" name="mapsUrl" placeholder="https://maps.google.com/..." defaultValue={initial.mapsUrl} /></div>
        <div><Label htmlFor="aboutTitle">Hakkımızda başlığı</Label><Input id="aboutTitle" name="aboutTitle" defaultValue={initial.aboutTitle} /></div>
        <div><Label htmlFor="aboutText">Hakkımızda metni</Label><Textarea id="aboutText" name="aboutText" rows={4} defaultValue={initial.aboutText} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="satisfactionPercent">Memnuniyet yüzdesi</Label><Input id="satisfactionPercent" name="satisfactionPercent" type="number" min={0} max={100} defaultValue={initial.satisfactionPercent} /></div>
          <div><Label htmlFor="yearsExperience">Deneyim (yıl)</Label><Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={100} defaultValue={initial.yearsExperience} /></div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="whyUs1Title">Neden biz — 1. başlık</Label>
          <Input id="whyUs1Title" name="whyUs1Title" defaultValue={initial.whyUs1Title} />
          <Label htmlFor="whyUs1Text">Neden biz — 1. metin</Label>
          <Textarea id="whyUs1Text" name="whyUs1Text" rows={2} defaultValue={initial.whyUs1Text} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="whyUs2Title">Neden biz — 2. başlık</Label>
          <Input id="whyUs2Title" name="whyUs2Title" defaultValue={initial.whyUs2Title} />
          <Label htmlFor="whyUs2Text">Neden biz — 2. metin</Label>
          <Textarea id="whyUs2Text" name="whyUs2Text" rows={2} defaultValue={initial.whyUs2Text} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="whyUs3Title">Neden biz — 3. başlık</Label>
          <Input id="whyUs3Title" name="whyUs3Title" defaultValue={initial.whyUs3Title} />
          <Label htmlFor="whyUs3Text">Neden biz — 3. metin</Label>
          <Textarea id="whyUs3Text" name="whyUs3Text" rows={2} defaultValue={initial.whyUs3Text} />
        </div>
      </fieldset>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>Kaydet</Button>
    </form>
  );
}
