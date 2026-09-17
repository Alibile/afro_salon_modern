"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKurus } from "@/lib/money";

export type ServiceItem = { id: string; name: string; durationMinutes: number; priceKurus: number };

export function ServiceStep({ services, selectedIds, onChange }: { services: ServiceItem[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  return (
    <section>
      <h2 className="mb-3 text-2xl">1. Hizmet seç</h2>
      <ul className="grid gap-2">
        {services.map((s) => {
          const on = selectedIds.includes(s.id);
          return (
            <li key={s.id}>
              <button type="button" onClick={() => toggle(s.id)} aria-pressed={on}
                className={cn("flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition", on && "border-primary ring-2 ring-primary/30")}>
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="text-sm text-muted-foreground">{s.durationMinutes} dk</span>
                </span>
                <span className="flex items-center gap-2 font-medium">{formatKurus(s.priceKurus)} {on && <Check className="size-4 text-primary" />}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
