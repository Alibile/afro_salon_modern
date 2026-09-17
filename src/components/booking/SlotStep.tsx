"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatShopTime } from "@/lib/time";

type Availability = { slots: string[]; isOpenToday: boolean; opensAt: string | null };

export function SlotStep({ barberId, durationMinutes, selected, onSelect }: { barberId: string; durationMinutes: number; selected: string | null; onSelect: (iso: string) => void }) {
  const [data, setData] = useState<Availability | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Barber/süre değişince önceki saatleri temizleyip yeniden yükleniyor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    fetch(`/api/availability?barberId=${barberId}&duration=${durationMinutes}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Saatler yüklenemedi");
        return r.json();
      })
      .then((d) => alive && setData(d))
      .catch(() => alive && setError("Saatler yüklenemedi"));
    return () => { alive = false; };
  }, [barberId, durationMinutes]);

  return (
    <section>
      <h2 className="display-md mb-4">3. Saat seç</h2>
      {error && <p className="text-destructive">{error}</p>}
      {!data && !error && <p className="text-muted-foreground">Yükleniyor…</p>}
      {data && !data.isOpenToday && (
        <p className="border border-border bg-muted p-4">Bugün kapalıyız. {data.opensAt ? `Yarın ${data.opensAt} itibarıyla tekrar deneyin.` : ""}</p>
      )}
      {data && data.isOpenToday && data.slots.length === 0 && (
        <p className="border border-border bg-muted p-4">Bugün için uygun saat kalmadı. {data.opensAt ? `Yarın ${data.opensAt} itibarıyla tekrar deneyin.` : ""}</p>
      )}
      {data && data.slots.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {data.slots.map((iso) => (
            <button key={iso} type="button" onClick={() => onSelect(iso)} aria-pressed={selected === iso}
              className={cn("border border-border bg-card py-2.5 text-sm font-medium tabular-nums transition-colors", selected === iso ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground/40")}>
              {formatShopTime(new Date(iso))}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
