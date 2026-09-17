import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatShopTime } from "@/lib/time";
import { formatKurus } from "@/lib/money";
import type { PanelAppointment } from "@/lib/queries/panel";
import { AppointmentActions } from "./AppointmentActions";

const STATUS: Record<PanelAppointment["status"], string> = { SCHEDULED: "Planlandı", COMPLETED: "Tamamlandı", CANCELLED: "İptal", NO_SHOW: "Gelmedi" };

export function TodayBoard({ columns }: { columns: { barberId: string; barberName: string; appointments: PanelAppointment[] }[] }) {
  if (columns.length === 0) return <p className="text-muted-foreground">Aktif berber yok.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((c) => (
        <section key={c.barberId} className="rounded-xl border bg-card">
          <h2 className="border-b px-4 py-3 text-xl">{c.barberName}</h2>
          <ul className="divide-y">
            {c.appointments.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">Bugün randevu yok</li>}
            {c.appointments.map((a) => (
              <li key={a.id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatShopTime(a.startsAt)} – {formatShopTime(a.endsAt)}</span>
                  <Badge variant={a.status === "SCHEDULED" ? "default" : "secondary"}>{STATUS[a.status]}</Badge>
                </div>
                <p className="text-sm">
                  <Link href={`/panel/musteriler/${a.customerId}`} className="underline">{a.customerName}</Link>
                  {a.customerPhone && <span className="text-muted-foreground"> · {a.customerPhone}</span>}
                </p>
                <p className="text-sm text-muted-foreground">{a.services.join(", ")} · {formatKurus(a.totalKurus)}</p>
                {a.status === "SCHEDULED" && <AppointmentActions id={a.id} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
