"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { updateSettings } from "@/actions/settings";
import type { SettingsInput } from "@/schemas/settings";
import { useActionError } from "@/lib/use-action-error";
import { readI18nField } from "@/lib/i18n-content";
import { I18nTextField, I18nTextarea } from "./I18nField";
import { PanelSection } from "./PanelSection";

/**
 * Dört bölüm: Dükkan, Randevu kuralları, Bağlantılar, Site metinleri. Her
 * bölüm solda başlık + açıklama, sağda alanlar (`PanelSection`); kısa alanlar
 * iki sütun. Kaydet düğmesi yapışkan altlıkta: uzun formda her zaman elin
 * altında.
 */
export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
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
      <PanelSection title={t("settings.shopLegend")} description={t("settings.shopHint")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="shopName" label={t("settings.shopName")} className="sm:col-span-2"><Input id="shopName" name="shopName" defaultValue={initial.shopName} required /></Field>
          <Field id="address" label={t("settings.address")} className="sm:col-span-2"><Input id="address" name="address" defaultValue={initial.address} /></Field>
          <Field id="phone" label={t("settings.phone")}><Input id="phone" name="phone" type="tel" defaultValue={initial.phone} /></Field>
          <Field id="email" label={t("settings.email")}><Input id="email" name="email" type="email" defaultValue={initial.email} /></Field>
        </div>
      </PanelSection>

      <PanelSection title={t("settings.rulesLegend")} description={t("settings.rulesHint")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cancellationWindowMinutes" label={t("settings.cancellationWindow")}><Input id="cancellationWindowMinutes" name="cancellationWindowMinutes" type="number" min={0} max={1440} defaultValue={initial.cancellationWindowMinutes} /></Field>
          <Field id="minLeadMinutes" label={t("settings.minLead")}><Input id="minLeadMinutes" name="minLeadMinutes" type="number" min={0} max={240} defaultValue={initial.minLeadMinutes} /></Field>
          <Field id="slotStepMinutes" label={t("settings.slotStep")}>
            <Select id="slotStepMinutes" name="slotStepMinutes" defaultValue={initial.slotStepMinutes}>
              {[5, 10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
            <input type="checkbox" name="notifyBarberOnBooking" defaultChecked={initial.notifyBarberOnBooking} className="size-4 accent-primary" /> {t("settings.notifyBarber")}
          </label>
        </div>
      </PanelSection>

      <PanelSection title={t("settings.linksLegend")} description={t("settings.linksHint")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="instagram" label="Instagram"><Input id="instagram" name="instagram" placeholder={t("settings.instagramPlaceholder")} defaultValue={initial.instagram} /></Field>
          <Field id="facebook" label="Facebook"><Input id="facebook" name="facebook" placeholder="https://facebook.com/..." defaultValue={initial.facebook} /></Field>
          <Field id="whatsapp" label="WhatsApp"><Input id="whatsapp" name="whatsapp" placeholder="905551112233" defaultValue={initial.whatsapp} /></Field>
          <Field id="mapsUrl" label={t("settings.mapsUrl")}><Input id="mapsUrl" name="mapsUrl" placeholder="https://maps.google.com/..." defaultValue={initial.mapsUrl} /></Field>
        </div>
      </PanelSection>

      <PanelSection title={t("settings.contentLegend")} description={t("settings.contentHint")}>
        <div className="grid gap-4">
          <I18nTextField name="aboutTitle" label={t("settings.aboutTitle")} defaultValue={initial.aboutTitle} maxLength={100} />
          <I18nTextarea name="aboutText" label={t("settings.aboutText")} defaultValue={initial.aboutText} rows={4} maxLength={500} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="satisfactionPercent" label={t("settings.satisfaction")}><Input id="satisfactionPercent" name="satisfactionPercent" type="number" min={0} max={100} defaultValue={initial.satisfactionPercent} /></Field>
            <Field id="yearsExperience" label={t("settings.years")}><Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={100} defaultValue={initial.yearsExperience} /></Field>
          </div>
          {([1, 2, 3] as const).map((index) => (
            <div key={index} className="grid gap-4 border-t border-border pt-4">
              <I18nTextField name={`whyUs${index}Title`} label={t("settings.whyUsTitle", { index })} defaultValue={initial[`whyUs${index}Title`]} maxLength={60} />
              <I18nTextarea name={`whyUs${index}Text`} label={t("settings.whyUsText", { index })} defaultValue={initial[`whyUs${index}Text`]} rows={2} maxLength={500} />
            </div>
          ))}
        </div>
      </PanelSection>

      <div className="sticky bottom-0 -mx-5 mt-2 border-t border-border bg-background/95 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="submit" disabled={pending}>{t("common.save")}</Button>
        </div>
      </div>
    </form>
  );
}
