import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { formatShopTime } from "@/lib/time";
import { formatKurus } from "@/lib/money";
import type { AppLocale } from "@/i18n/routing";
import type { PanelAppointment } from "@/lib/queries/panel";
import { AppointmentActions } from "./AppointmentActions";

export async function TodayBoard({ columns }: { columns: { barberId: string; barberName: string; appointments: PanelAppointment[] }[] }) {
  const t = await getTranslations("panel");
  const locale = (await getLocale()) as AppLocale;
  if (columns.length === 0) return <p className="text-muted-foreground">{t("today.noBarbers")}</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((c) => (
        <section key={c.barberId} className="rounded-xl border bg-card">
          <h2 className="border-b px-4 py-3 text-xl">{c.barberName}</h2>
          <ul className="divide-y">
            {c.appointments.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">{t("today.noAppointments")}</li>}
            {c.appointments.map((a) => (
              <li key={a.id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatShopTime(a.startsAt)} – {formatShopTime(a.endsAt)}</span>
                  <Badge variant={a.status === "SCHEDULED" ? "default" : "secondary"}>{t(`common.status.${a.status}`)}</Badge>
                </div>
                <p className="text-sm">
                  <Link href={`/panel/musteriler/${a.customerId}`} className="underline">{a.customerName}</Link>
                  {a.customerPhone && <span className="text-muted-foreground"> · {a.customerPhone}</span>}
                </p>
                <p className="text-sm text-muted-foreground">{a.services.join(", ")} · {formatKurus(a.totalKurus, locale)}</p>
                {a.status === "SCHEDULED" && <AppointmentActions id={a.id} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
