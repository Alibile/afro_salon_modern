import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { formatKurus } from "@/lib/money";
import type { AppLocale } from "@/i18n/routing";

type Row = { id: string; startsAt: Date; endsAt: Date; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"; barberName: string; customerId: string; customerName: string; customerPhone: string | null; services: string[]; totalKurus: number };

export async function AppointmentsTable({ rows }: { rows: Row[] }) {
  const t = await getTranslations("panel");
  const locale = (await getLocale()) as AppLocale;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>{t("appointments.date")}</TableHead><TableHead>{t("appointments.time")}</TableHead><TableHead>{t("appointments.barber")}</TableHead><TableHead>{t("appointments.customer")}</TableHead><TableHead>{t("appointments.service")}</TableHead><TableHead>{t("appointments.total")}</TableHead><TableHead>{t("appointments.status")}</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t("appointments.empty")}</TableCell></TableRow>}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{formatShopDate(r.startsAt, locale)}</TableCell>
              <TableCell>{formatShopTime(r.startsAt)}–{formatShopTime(r.endsAt)}</TableCell>
              <TableCell>{r.barberName}</TableCell>
              <TableCell><Link href={`/panel/musteriler/${r.customerId}`} className="underline">{r.customerName}</Link>{r.customerPhone && <span className="block text-xs text-muted-foreground">{r.customerPhone}</span>}</TableCell>
              <TableCell>{r.services.join(", ")}</TableCell>
              <TableCell>{formatKurus(r.totalKurus, locale)}</TableCell>
              <TableCell><Badge variant={r.status === "SCHEDULED" ? "default" : "secondary"}>{t(`common.status.${r.status}`)}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
