import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { toAppLocale } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/panel/ProfileForm";
import { PasswordForm } from "@/components/panel/PasswordForm";
import { LanguageForm } from "@/components/panel/LanguageForm";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const actor = await requireStaff();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    include: { barber: true },
  });
  const t = await getTranslations("panel.profile");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl">{t("title")}</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">{t("infoTitle")}</h2>
        <ProfileForm
          profile={{
            name: user.name,
            phone: user.phone ?? "",
            bio: user.barber?.bio ?? "",
            photoKey: user.barber?.photoKey ?? "",
          }}
          hasBarber={Boolean(user.barber)}
        />
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">{t("languageTitle")}</h2>
        {/*
         * Kutuda kayıtlı tercih görünür, adresin dili değil: `/panel/profil`
         * (Türkçe adres) açan Fransızca kayıtlı berber "Français" görmeli.
         */}
        <LanguageForm saved={toAppLocale(user.locale)} />
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">{t("passwordTitle")}</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
