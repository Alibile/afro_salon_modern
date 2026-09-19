import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { asI18nText } from "@/lib/i18n-content";
import { SettingsForm } from "@/components/panel/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
  await requireAdmin();
  const s = await getSettings();
  const t = await getTranslations("panel.settings");
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl">{t("title")}</h1>
      <SettingsForm
        initial={{
          shopName: s.shopName,
          address: s.address,
          phone: s.phone,
          cancellationWindowMinutes: s.cancellationWindowMinutes,
          minLeadMinutes: s.minLeadMinutes,
          slotStepMinutes: s.slotStepMinutes,
          notifyBarberOnBooking: s.notifyBarberOnBooking,
          email: s.email,
          instagram: s.instagram,
          facebook: s.facebook,
          whatsapp: s.whatsapp,
          mapsUrl: s.mapsUrl,
          aboutTitle: asI18nText(s.aboutTitleI18n),
          aboutText: asI18nText(s.aboutTextI18n),
          whyUs1Title: asI18nText(s.whyUs1TitleI18n),
          whyUs1Text: asI18nText(s.whyUs1TextI18n),
          whyUs2Title: asI18nText(s.whyUs2TitleI18n),
          whyUs2Text: asI18nText(s.whyUs2TextI18n),
          whyUs3Title: asI18nText(s.whyUs3TitleI18n),
          whyUs3Text: asI18nText(s.whyUs3TextI18n),
          satisfactionPercent: s.satisfactionPercent,
          yearsExperience: s.yearsExperience,
        }}
      />
    </div>
  );
}
