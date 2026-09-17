import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ServiceForm } from "@/components/panel/ServiceForm";
import { ServiceRow } from "@/components/panel/ServiceRow";

export const dynamic = "force-dynamic";

export default async function HizmetlerPage() {
  await requireAdmin();
  const services = await prisma.service.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Hizmetler</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Yeni hizmet</h2>
        <ServiceForm />
      </section>
      <ul className="space-y-2">
        {services.map((s) => <ServiceRow key={s.id} service={{ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus, sortOrder: s.sortOrder, isActive: s.isActive }} />)}
      </ul>
    </div>
  );
}
