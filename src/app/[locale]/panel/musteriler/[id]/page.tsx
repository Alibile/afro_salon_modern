import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { getCustomerDetail } from "@/lib/queries/customers";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { getSettings } from "@/lib/settings";
import { AppointmentCard } from "@/components/booking/AppointmentCard";
import { PanelPage } from "@/components/panel/PanelPage";
import { PhotoGrid } from "@/components/panel/PhotoGrid";
import { PhotoUploadButton } from "@/components/panel/PhotoUploadButton";
import { MAX_PHOTOS_PER_CUSTOMER } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function MusteriDetayPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await props.params;
  const [c, settings, barbers] = await Promise.all([getCustomerDetail(user, id), getSettings(), user.role === "ADMIN" ? listBarbersForAdmin() : Promise.resolve([])]);
  if (!c) notFound();
  const t = await getTranslations("panel.customers");
  return (
    <PanelPage
      title={c.name}
      description={
        <span className="flex flex-wrap gap-x-4">
          {c.phone && <span>{c.phone}</span>}
          <span>{c.email}</span>
        </span>
      }
      width="narrow"
    >
      <section className="rounded-[var(--radius)] border border-border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-medium">{t("photosTitle", { count: c.photos.length, max: MAX_PHOTOS_PER_CUSTOMER })}</h2>
          <PhotoUploadButton customerId={c.id} barbers={user.role === "ADMIN" ? barbers.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name })) : null} />
        </div>
        <PhotoGrid photos={c.photos} deletableIds={c.photos.filter((p) => user.role === "ADMIN" || p.barberId === user.barberId).map((p) => p.id)} />
      </section>
      <section>
        <h2 className="mb-3 text-base font-medium">{t("appointments")}</h2>
        <div className="space-y-2">{c.appointments.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} />)}</div>
      </section>
    </PanelPage>
  );
}
