import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { getCustomerDetail } from "@/lib/queries/customers";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { getSettings } from "@/lib/settings";
import { AppointmentCard } from "@/components/booking/AppointmentCard";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">{c.name}</h1>
        <p className="text-muted-foreground">{c.phone ?? "-"} · {c.email}</p>
      </div>
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl">{t("photosTitle", { count: c.photos.length, max: MAX_PHOTOS_PER_CUSTOMER })}</h2>
          <PhotoUploadButton customerId={c.id} barbers={user.role === "ADMIN" ? barbers.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name })) : null} />
        </div>
        <PhotoGrid photos={c.photos} deletableIds={c.photos.filter((p) => user.role === "ADMIN" || p.barberId === user.barberId).map((p) => p.id)} />
      </section>
      <section>
        <h2 className="mb-3 text-xl">{t("appointments")}</h2>
        <div className="space-y-2">{c.appointments.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} />)}</div>
      </section>
    </div>
  );
}
