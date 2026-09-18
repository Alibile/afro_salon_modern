"use client";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTimeOff } from "@/actions/timeoff";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { useActionError } from "@/lib/use-action-error";

type Item = { id: string; barberName: string; startsAt: Date; endsAt: Date; reason: string | null };

export function TimeOffList({ items }: { items: Item[] }) {
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();
  if (items.length === 0) return <p className="text-muted-foreground">Yaklaşan izin yok.</p>;
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
          <div>
            <p className="font-medium">{t.barberName}</p>
            <p className="text-sm text-muted-foreground">{formatShopDate(t.startsAt)} · {formatShopTime(t.startsAt)}–{formatShopTime(t.endsAt)} {t.reason && `· ${t.reason}`}</p>
          </div>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => {
            const r = await deleteTimeOff(t.id);
            if (r.ok) { toast.success("İzin silindi"); router.refresh(); } else toast.error(showError(r));
          })}>Sil</Button>
        </li>
      ))}
    </ul>
  );
}
