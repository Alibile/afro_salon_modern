import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getBarberDetail } from "@/lib/queries/barbers";
import { BarberForm } from "@/components/panel/BarberForm";
import { WorkingHoursForm } from "@/components/panel/WorkingHoursForm";

export const dynamic = "force-dynamic";

export default async function BerberDetayPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await props.params;
  const barber = await getBarberDetail(id);
  if (!barber) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">{barber.name}</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Bilgiler</h2>
        <BarberForm mode="edit" barber={barber} />
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Çalışma saatleri</h2>
        <WorkingHoursForm barberId={barber.id} hours={barber.hours} />
      </section>
    </div>
  );
}
