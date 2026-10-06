import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StatusDot } from "@/components/ui/status-dot";
import { formatShopTime } from "@/lib/time";
import { formatKurus } from "@/lib/money";
import type { AppLocale } from "@/i18n/routing";
import type { PanelAppointment } from "@/lib/queries/panel";
import { AppointmentActions } from "./AppointmentActions";

/**
 * Bugünün panosu: berber başına bir sütun. Her randevu satırında solda saat
 * bloğu (başlangıç üstte, bitiş altta), sağda müşteri, hizmet, tutar, durum
 * ve yalnızca planlı randevuda üç küçük eylem. Satır `data-appointment`
 * taşır: e2e müşteri adıyla filtreleyip aynı satırı takip eder.
 */
export async function TodayBoard({ columns }: { columns: { barberId: string; barberName: string; appointments: PanelAppointment[] }[] }) {
  const t = await getTranslations("panel");
  const locale = (await getLocale()) as AppLocale;
  if (columns.length === 0) return <p className="text-muted-foreground">{t("today.noBarbers")}</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((c) => (
        <section key={c.barberId} className="rounded-[var(--radius)] border border-border">
          <h2 className="border-b border-border px-4 py-3 text-base font-medium">{c.barberName}</h2>
          <ul className="divide-y divide-border">
            {c.appointments.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">{t("today.noAppointments")}</li>}
            {c.appointments.map((a) => (
              <li key={a.id} data-appointment={a.id} className="grid grid-cols-[3.25rem_1fr] gap-3 px-4 py-3">
                <div className="tabular-nums">
                  <span className="block text-sm font-medium">{formatShopTime(a.startsAt)}</span>
                  <span className="block text-xs text-muted-foreground">{formatShopTime(a.endsAt)}</span>
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/panel/musteriler/${a.customerId}`} className="truncate text-sm font-medium hover:underline">
                      {a.customerName}
                    </Link>
                    <StatusDot status={a.status} label={t(`common.status.${a.status}`)} className="text-xs" />
                  </div>
                  {a.customerPhone && <p className="text-xs text-muted-foreground">{a.customerPhone}</p>}
                  <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                    <span>{a.services.join(", ")}</span>
                    <span className="tabular-nums">{formatKurus(a.totalKurus, locale)}</span>
                  </p>
                  {a.status === "SCHEDULED" && <AppointmentActions id={a.id} />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
