import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getBarberDetail } from "@/lib/queries/barbers";
import { BarberForm } from "@/components/panel/BarberForm";
import { WorkingHoursForm } from "@/components/panel/WorkingHoursForm";
import { DeleteButton } from "@/components/panel/DeleteButton";
import { PanelPage } from "@/components/panel/PanelPage";
import { PanelSection } from "@/components/panel/PanelSection";
import { deleteBarber } from "@/actions/barbers";

export const dynamic = "force-dynamic";

export default async function BerberDetayPage(props: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await props.params;
  const barber = await getBarberDetail(id);
  if (!barber) notFound();
  const hasHistory = barber.appointmentCount > 0 || barber.photoCount > 0;
  const isSelf = actor.barberId === barber.id;
  const t = await getTranslations("panel.barbers");
  return (
    <PanelPage
      title={barber.name}
      description={barber.email}
      width="narrow"
      action={
        <DeleteButton
          title={t("deleteTitle")}
          description={t("deleteDescription", { name: barber.name })}
          disabled={hasHistory || isSelf}
          disabledReason={isSelf ? t("deleteSelf") : hasHistory ? t("deleteBlocked") : undefined}
          onConfirm={() => deleteBarber(barber.id)}
          successMessage={t("deleted")}
          redirectTo="/panel/berberler"
        />
      }
    >
      <PanelSection title={t("infoTitle")}>
        <BarberForm mode="edit" barber={barber} />
      </PanelSection>
      <PanelSection title={t("hoursTitle")}>
        <WorkingHoursForm barberId={barber.id} hours={barber.hours} />
      </PanelSection>
    </PanelPage>
  );
}
