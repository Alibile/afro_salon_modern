import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { toAppLocale } from "@/i18n/routing";
import { asI18nText } from "@/lib/i18n-content";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/panel/ProfileForm";
import { PasswordForm } from "@/components/panel/PasswordForm";
import { LanguageForm } from "@/components/panel/LanguageForm";
import { PanelPage } from "@/components/panel/PanelPage";
import { PanelSection } from "@/components/panel/PanelSection";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const actor = await requireStaff();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    include: { barber: true },
  });
  const t = await getTranslations("panel.profile");

  return (
    <PanelPage title={t("title")}>
      <div>
        <PanelSection title={t("infoTitle")}>
          <ProfileForm
            profile={{
              name: user.name,
              phone: user.phone ?? "",
              bioI18n: asI18nText(user.barber?.bioI18n),
              photoKey: user.barber?.photoKey ?? "",
            }}
            hasBarber={Boolean(user.barber)}
          />
        </PanelSection>
        <PanelSection title={t("languageTitle")} description={t("languageHint")}>
          {/* Kutuda kayıtlı tercih görünür, adresin dili değil. */}
          <LanguageForm saved={toAppLocale(user.locale)} />
        </PanelSection>
        <PanelSection title={t("passwordTitle")}>
          <PasswordForm />
        </PanelSection>
      </div>
    </PanelPage>
  );
}
