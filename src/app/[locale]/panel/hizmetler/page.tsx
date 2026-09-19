import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { listServicesForAdmin } from "@/lib/queries/services";
import { ServiceForm } from "@/components/panel/ServiceForm";
import { ServiceRow } from "@/components/panel/ServiceRow";

export const dynamic = "force-dynamic";

export default async function HizmetlerPage({ params }: { params: Promise<{ locale: string }> }) {
  await requireAdmin();
  const { locale } = await params;
  // Liste panel kullanıcısının dilinde okunur; form üç sekmeyi ham içerikten doldurur.
  const services = await listServicesForAdmin(locale);
  const t = await getTranslations("panel.services");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">{t("title")}</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">{t("newTitle")}</h2>
        <ServiceForm />
      </section>
      <ul className="space-y-2">
        {services.map((s) => <ServiceRow key={s.id} service={s} />)}
      </ul>
    </div>
  );
}
