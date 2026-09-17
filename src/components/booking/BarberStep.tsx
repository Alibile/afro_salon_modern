"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { publicUrl } from "@/lib/storage-public";

export type BarberItem = { id: string; name: string; bio: string | null; photoKey: string; recentPhotoKeys: string[] };

export function BarberStep({ barbers, selectedId, onSelect }: { barbers: BarberItem[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl">2. Berber seç</h2>
      <ul className="grid gap-3">
        {barbers.map((b) => (
          <li key={b.id}>
            <button type="button" onClick={() => onSelect(b.id)} aria-pressed={selectedId === b.id}
              className={cn("flex w-full gap-3 rounded-xl border bg-card p-3 text-left", selectedId === b.id && "border-primary ring-2 ring-primary/30")}>
              <Image src={publicUrl(b.photoKey)} alt={b.name} width={64} height={64} className="size-16 rounded-full object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{b.name}</span>
                {b.bio && <span className="block text-sm text-muted-foreground">{b.bio}</span>}
                {b.recentPhotoKeys.length > 0 && (
                  <span className="mt-2 flex gap-1">
                    {b.recentPhotoKeys.map((k) => (
                      <Image key={k} src={publicUrl(k)} alt="" width={40} height={40} className="size-10 rounded-md object-cover" />
                    ))}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
