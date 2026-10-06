import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { listServicesForAdmin } from "@/lib/queries/services";
import { ServiceForm } from "@/components/panel/ServiceForm";
import { ServiceTable } from "@/components/panel/ServiceTable";
import { NewRecordPanel } from "@/components/panel/NewRecordPanel";

export const dynamic = "force-dynamic";

export default async function HizmetlerPage({ params }: { params: Promise<{ locale: string }> }) {
  await requireAdmin();
  const { locale } = await params;
  // Liste panel kullanıcısının dilinde okunur; form üç sekmeyi ham içerikten doldurur.
  const services = await listServicesForAdmin(locale);
  const t = await getTranslations("panel.services");
  return (
    <NewRecordPanel pageTitle={t("title")} label={t("newTitle")} title={t("newTitle")} form={<ServiceForm />}>
      <ServiceTable services={services} />
    </NewRecordPanel>
  );
}
