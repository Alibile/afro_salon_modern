"use client";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleService, deleteService } from "@/actions/services";
import { ServiceForm } from "./ServiceForm";
import { InlinePrice } from "./InlinePrice";
import { DeleteButton } from "./DeleteButton";

type S = { id: string; name: string; durationMinutes: number; priceKurus: number; sortOrder: number; isActive: boolean; usageCount: number };

export function ServiceRow({ service }: { service: S }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <li className="rounded-xl border bg-card p-4">
      {editing ? (
        <ServiceForm initial={service} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{service.name} {!service.isActive && <Badge variant="secondary">Pasif</Badge>}</p>
            <p className="text-sm text-muted-foreground">
              {service.durationMinutes} dk · <InlinePrice service={service} /> · sıra {service.sortOrder}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Düzenle</Button>
            <Button size="sm" variant="secondary" disabled={pending}
              onClick={() => start(async () => { await toggleService(service.id, !service.isActive); router.refresh(); })}>
              {service.isActive ? "Pasife al" : "Aktif et"}
            </Button>
            <DeleteButton
              title="Hizmet silinsin mi?"
              description={`"${service.name}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
              disabled={service.usageCount > 0}
              disabledReason={service.usageCount > 0 ? "Bu hizmet geçmiş randevularda kullanılmış, silinemez; pasife alın" : undefined}
              onConfirm={() => deleteService(service.id)}
              successMessage="Hizmet silindi"
            />
          </div>
        </div>
      )}
    </li>
  );
}
