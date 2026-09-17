import { requireAdmin } from "@/lib/auth-helpers";
import { listServicesForAdmin } from "@/lib/queries/services";
import { ServiceForm } from "@/components/panel/ServiceForm";
import { ServiceRow } from "@/components/panel/ServiceRow";

export const dynamic = "force-dynamic";

export default async function HizmetlerPage() {
  await requireAdmin();
  const services = await listServicesForAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Hizmetler</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Yeni hizmet</h2>
        <ServiceForm />
      </section>
      <ul className="space-y-2">
        {services.map((s) => <ServiceRow key={s.id} service={s} />)}
      </ul>
    </div>
  );
}
