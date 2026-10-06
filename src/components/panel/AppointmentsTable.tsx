import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ResponsiveTable, RBody, RCell, RHead, RHeadCell, RHeader, RRow } from "@/components/panel/ResponsiveTable";
import { StatusDot } from "@/components/ui/status-dot";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { formatKurus } from "@/lib/money";
import type { AppLocale } from "@/i18n/routing";

type Row = { id: string; startsAt: Date; endsAt: Date; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"; barberName: string; customerId: string; customerName: string; customerPhone: string | null; services: string[]; totalKurus: number };

/**
 * Randevu listesi. Geniş ekranda yedi sütunlu tablo; telefonda her satır
 * etiketli bir kart (`ResponsiveTable`). Durum nokta + metin.
 */
export async function AppointmentsTable({ rows }: { rows: Row[] }) {
  const t = await getTranslations("panel");
  const locale = (await getLocale()) as AppLocale;
  const H = {
    date: t("appointments.date"),
    time: t("appointments.time"),
    barber: t("appointments.barber"),
    customer: t("appointments.customer"),
    service: t("appointments.service"),
    total: t("appointments.total"),
    status: t("appointments.status"),
  };
  return (
    <ResponsiveTable>
      <RHeader>
        <RHead>
          <RHeadCell>{H.date}</RHeadCell>
          <RHeadCell>{H.time}</RHeadCell>
          <RHeadCell>{H.barber}</RHeadCell>
          <RHeadCell>{H.customer}</RHeadCell>
          <RHeadCell>{H.service}</RHeadCell>
          <RHeadCell className="text-right">{H.total}</RHeadCell>
          <RHeadCell>{H.status}</RHeadCell>
        </RHead>
      </RHeader>
      <RBody>
        {rows.length === 0 && (
          <RRow>
            <RCell colSpan={7} className="text-center text-muted-foreground">
              {t("appointments.empty")}
            </RCell>
          </RRow>
        )}
        {rows.map((r) => (
          <RRow key={r.id}>
            <RCell label={H.date}>{formatShopDate(r.startsAt, locale)}</RCell>
            <RCell label={H.time} className="tabular-nums">
              {formatShopTime(r.startsAt)}–{formatShopTime(r.endsAt)}
            </RCell>
            <RCell label={H.barber}>{r.barberName}</RCell>
            <RCell label={H.customer}>
              <Link href={`/panel/musteriler/${r.customerId}`} className="font-medium hover:underline">
                {r.customerName}
              </Link>
              {r.customerPhone && <span className="block text-xs text-muted-foreground">{r.customerPhone}</span>}
            </RCell>
            <RCell label={H.service} className="whitespace-normal">
              {r.services.join(", ")}
            </RCell>
            <RCell label={H.total} className="tabular-nums md:text-right">
              {formatKurus(r.totalKurus, locale)}
            </RCell>
            <RCell label={H.status}>
              <StatusDot status={r.status} label={t(`common.status.${r.status}`)} />
            </RCell>
          </RRow>
        ))}
      </RBody>
    </ResponsiveTable>
  );
}
