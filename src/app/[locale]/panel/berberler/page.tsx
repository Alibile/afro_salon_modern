import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth-helpers";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { BarberForm } from "@/components/panel/BarberForm";
import { NewRecordPanel } from "@/components/panel/NewRecordPanel";
import { ResponsiveTable, RBody, RCell, RHead, RHeadCell, RHeader, RRow } from "@/components/panel/ResponsiveTable";
import { Badge } from "@/components/ui/badge";
import { publicUrl } from "@/lib/storage-public";

export const dynamic = "force-dynamic";

export default async function BerberlerPage() {
  await requireAdmin();
  const barbers = await listBarbersForAdmin();
  const t = await getTranslations("panel");
  const H = { name: t("barbers.name"), email: t("barbers.email"), status: t("appointments.status") };
  return (
    <NewRecordPanel pageTitle={t("barbers.title")} label={t("barbers.newTitle")} title={t("barbers.newTitle")} form={<BarberForm mode="create" />}>
      <ResponsiveTable>
        <RHeader>
          <RHead>
            <RHeadCell>{H.name}</RHeadCell>
            <RHeadCell>{H.email}</RHeadCell>
            <RHeadCell>{H.status}</RHeadCell>
            <RHeadCell className="text-right">{t("common.actions")}</RHeadCell>
          </RHead>
        </RHeader>
        <RBody>
          {barbers.map((b) => (
            <RRow key={b.id}>
              <RCell label={H.name}>
                <span className="flex items-center gap-3">
                  <Image src={publicUrl(b.photoKey)} alt="" width={36} height={36} className="size-9 rounded-[var(--radius)] object-cover" />
                  <span className="font-medium">{b.name}</span>
                </span>
              </RCell>
              <RCell label={H.email} className="whitespace-normal text-muted-foreground">{b.email}</RCell>
              <RCell label={H.status}>{b.isActive ? <span className="text-sm text-muted-foreground">{t("common.active")}</span> : <Badge variant="outline">{t("common.inactive")}</Badge>}</RCell>
              <RCell className="md:text-right">
                <Link href={`/panel/berberler/${b.id}`} className="text-sm font-medium text-primary hover:underline">
                  {t("common.edit")}
                </Link>
              </RCell>
            </RRow>
          ))}
        </RBody>
      </ResponsiveTable>
    </NewRecordPanel>
  );
}
