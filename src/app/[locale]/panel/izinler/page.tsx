import { requireStaff } from "@/lib/auth-helpers";
import { listUpcomingTimeOff } from "@/lib/queries/timeoff";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { TimeOffForm } from "@/components/panel/TimeOffForm";
import { TimeOffList } from "@/components/panel/TimeOffList";

export const dynamic = "force-dynamic";

export default async function IzinlerPage() {
  const user = await requireStaff();
  const [items, barbers] = await Promise.all([
    listUpcomingTimeOff(user),
    user.role === "ADMIN" ? listBarbersForAdmin() : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">İzinler</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Yeni izin</h2>
        <TimeOffForm barbers={user.role === "ADMIN" ? barbers.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name })) : null} ownBarberId={user.barberId} />
      </section>
      <TimeOffList items={items} />
    </div>
  );
}
