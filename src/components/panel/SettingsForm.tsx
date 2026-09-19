"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/actions/settings";
import type { SettingsInput } from "@/schemas/settings";
import { useActionError } from "@/lib/use-action-error";
import { readI18nField } from "@/lib/i18n-content";
import { I18nTextField, I18nTextarea } from "./I18nField";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const t = useTranslations("panel");
  const showError = useActionError();
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
            aboutTitle: readI18nField(fd, "aboutTitle"),
            aboutText: readI18nField(fd, "aboutText"),
            whyUs1Title: readI18nField(fd, "whyUs1Title"),
            whyUs1Text: readI18nField(fd, "whyUs1Text"),
            whyUs2Title: readI18nField(fd, "whyUs2Title"),
            whyUs2Text: readI18nField(fd, "whyUs2Text"),
            whyUs3Title: readI18nField(fd, "whyUs3Title"),
            whyUs3Text: readI18nField(fd, "whyUs3Text"),
            satisfactionPercent: Number(fd.get("satisfactionPercent")),
            yearsExperience: Number(fd.get("yearsExperience")),
          });
          if (!r.ok) { setError(showError(r)); return; }
          setError(null); toast.success(t("settings.saved"));
        });
      }}
    >
      <fieldset className="grid gap-3 rounded-xl border bg-card p-4">
        <legend className="px-1 text-lg font-medium">{t("settings.shopLegend")}</legend>
        <div><Label htmlFor="shopName">{t("settings.shopName")}</Label><Input id="shopName" name="shopName" defaultValue={initial.shopName} required /></div>
        <div><Label htmlFor="address">{t("settings.address")}</Label><Input id="address" name="address" defaultValue={initial.address} /></div>
        <div><Label htmlFor="phone">{t("settings.phone")}</Label><Input id="phone" name="phone" defaultValue={initial.phone} /></div>
        <div><Label htmlFor="cancellationWindowMinutes">{t("settings.cancellationWindow")}</Label><Input id="cancellationWindowMinutes" name="cancellationWindowMinutes" type="number" min={0} max={1440} defaultValue={initial.cancellationWindowMinutes} /></div>
        <div><Label htmlFor="minLeadMinutes">{t("settings.minLead")}</Label><Input id="minLeadMinutes" name="minLeadMinutes" type="number" min={0} max={240} defaultValue={initial.minLeadMinutes} /></div>
        <div>
          <Label htmlFor="slotStepMinutes">{t("settings.slotStep")}</Label>
          <select id="slotStepMinutes" name="slotStepMinutes" defaultValue={initial.slotStepMinutes} className="mt-1 w-full rounded-md border bg-background px-3 py-2">
            {[5, 10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notifyBarberOnBooking" defaultChecked={initial.notifyBarberOnBooking} /> {t("settings.notifyBarber")}</label>
      </fieldset>

      <fieldset className="grid gap-3 rounded-xl border bg-card p-4">
        <legend className="px-1 text-lg font-medium">{t("settings.contentLegend")}</legend>
        <div><Label htmlFor="email">{t("settings.email")}</Label><Input id="email" name="email" type="email" defaultValue={initial.email} /></div>
        <div><Label htmlFor="instagram">Instagram</Label><Input id="instagram" name="instagram" placeholder={t("settings.instagramPlaceholder")} defaultValue={initial.instagram} /></div>
        <div><Label htmlFor="facebook">Facebook</Label><Input id="facebook" name="facebook" placeholder="https://facebook.com/..." defaultValue={initial.facebook} /></div>
        <div><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" name="whatsapp" placeholder="905551112233" defaultValue={initial.whatsapp} /></div>
        <div><Label htmlFor="mapsUrl">{t("settings.mapsUrl")}</Label><Input id="mapsUrl" name="mapsUrl" placeholder="https://maps.google.com/..." defaultValue={initial.mapsUrl} /></div>
        <p className="text-xs text-muted-foreground">{t("i18nField.hint")}</p>
        <I18nTextField name="aboutTitle" label={t("settings.aboutTitle")} defaultValue={initial.aboutTitle} maxLength={100} />
        <I18nTextarea name="aboutText" label={t("settings.aboutText")} defaultValue={initial.aboutText} rows={4} maxLength={500} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="satisfactionPercent">{t("settings.satisfaction")}</Label><Input id="satisfactionPercent" name="satisfactionPercent" type="number" min={0} max={100} defaultValue={initial.satisfactionPercent} /></div>
          <div><Label htmlFor="yearsExperience">{t("settings.years")}</Label><Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={100} defaultValue={initial.yearsExperience} /></div>
        </div>
        <div className="grid gap-2">
          <I18nTextField name="whyUs1Title" label={t("settings.whyUsTitle", { index: 1 })} defaultValue={initial.whyUs1Title} maxLength={60} />
          <I18nTextarea name="whyUs1Text" label={t("settings.whyUsText", { index: 1 })} defaultValue={initial.whyUs1Text} rows={2} maxLength={500} />
        </div>
        <div className="grid gap-2">
          <I18nTextField name="whyUs2Title" label={t("settings.whyUsTitle", { index: 2 })} defaultValue={initial.whyUs2Title} maxLength={60} />
          <I18nTextarea name="whyUs2Text" label={t("settings.whyUsText", { index: 2 })} defaultValue={initial.whyUs2Text} rows={2} maxLength={500} />
        </div>
        <div className="grid gap-2">
          <I18nTextField name="whyUs3Title" label={t("settings.whyUsTitle", { index: 3 })} defaultValue={initial.whyUs3Title} maxLength={60} />
          <I18nTextarea name="whyUs3Text" label={t("settings.whyUsText", { index: 3 })} defaultValue={initial.whyUs3Text} rows={2} maxLength={500} />
        </div>
      </fieldset>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{t("common.save")}</Button>
    </form>
  );
}
