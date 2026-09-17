import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { formatKurus } from "@/lib/money";

type Row = { id: string; startsAt: Date; endsAt: Date; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"; barberName: string; customerId: string; customerName: string; customerPhone: string | null; services: string[]; totalKurus: number };
const STATUS = { SCHEDULED: "Planlandı", COMPLETED: "Tamamlandı", CANCELLED: "İptal", NO_SHOW: "Gelmedi" } as const;

export function AppointmentsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Saat</TableHead><TableHead>Berber</TableHead><TableHead>Müşteri</TableHead><TableHead>Hizmet</TableHead><TableHead>Tutar</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Kayıt yok</TableCell></TableRow>}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{formatShopDate(r.startsAt)}</TableCell>
              <TableCell>{formatShopTime(r.startsAt)}–{formatShopTime(r.endsAt)}</TableCell>
              <TableCell>{r.barberName}</TableCell>
              <TableCell><Link href={`/panel/musteriler/${r.customerId}`} className="underline">{r.customerName}</Link>{r.customerPhone && <span className="block text-xs text-muted-foreground">{r.customerPhone}</span>}</TableCell>
              <TableCell>{r.services.join(", ")}</TableCell>
              <TableCell>{formatKurus(r.totalKurus)}</TableCell>
              <TableCell><Badge variant={r.status === "SCHEDULED" ? "default" : "secondary"}>{STATUS[r.status]}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
