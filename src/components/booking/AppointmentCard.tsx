import { Badge } from "@/components/ui/badge";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopTime } from "@/lib/time";
import type { AppointmentView } from "@/lib/queries/customer";
import { CancelButton } from "./CancelButton";

const STATUS: Record<AppointmentView["status"], string> = {
  SCHEDULED: "Planlandı", COMPLETED: "Tamamlandı", CANCELLED: "İptal", NO_SHOW: "Gelmedi",
};

export function AppointmentCard({ a, shopPhone, big = false }: { a: AppointmentView; shopPhone: string; big?: boolean }) {
  return (
    <div className={big ? "border-l-4 border-primary bg-card p-5 shadow-none" : "border border-border bg-card p-4"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={big ? "display-md tabular-nums" : "font-display text-xl tracking-wide tabular-nums"}>{formatShopTime(a.startsAt)} – {formatShopTime(a.endsAt)}</p>
          <p className="editorial-note mt-1 text-sm text-muted-foreground">{formatShopDate(a.startsAt)}, {a.barberName}</p>
        </div>
        <Badge variant={a.status === "SCHEDULED" ? "default" : "secondary"}>{STATUS[a.status]}</Badge>
      </div>
      <p className="mt-2 text-sm">{a.services.map((s) => s.name).join(", ")} · {formatKurus(a.totalKurus)}</p>
      {a.status === "SCHEDULED" && (
        <div className="mt-3">
          {a.canCancel ? <CancelButton id={a.id} /> : <p className="text-sm text-muted-foreground">İptal için dükkanı arayın: {shopPhone}</p>}
        </div>
      )}
    </div>
  );
}
