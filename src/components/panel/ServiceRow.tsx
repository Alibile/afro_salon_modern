"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKurus } from "@/lib/money";
import { toggleService } from "@/actions/services";
import { ServiceForm } from "./ServiceForm";

type S = { id: string; name: string; durationMinutes: number; priceKurus: number; sortOrder: number; isActive: boolean };

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
            <p className="text-sm text-muted-foreground">{service.durationMinutes} dk · {formatKurus(service.priceKurus)} · sıra {service.sortOrder}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Düzenle</Button>
            <Button size="sm" variant="secondary" disabled={pending}
              onClick={() => start(async () => { await toggleService(service.id, !service.isActive); router.refresh(); })}>
              {service.isActive ? "Pasife al" : "Aktif et"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
