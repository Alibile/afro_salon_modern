import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
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
          aboutTitle: s.aboutTitle,
          aboutText: s.aboutText,
          whyUs1Title: s.whyUs1Title,
          whyUs1Text: s.whyUs1Text,
          whyUs2Title: s.whyUs2Title,
          whyUs2Text: s.whyUs2Text,
          whyUs3Title: s.whyUs3Title,
          whyUs3Text: s.whyUs3Text,
          satisfactionPercent: s.satisfactionPercent,
          yearsExperience: s.yearsExperience,
        }}
      />
    </div>
  );
}
