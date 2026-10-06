"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { publicUrl } from "@/lib/storage-public";

/** `bio` ziyaretçinin dilinde seçilmiş metin; çeviri de Türkçe de yoksa boş. */
export type BarberItem = { id: string; name: string; bio: string; photoKey: string; recentPhotoKeys: string[] };

/** Berber kartları: 72 px fotoğraf, ad, biyografi, altta son kesimler. */
export function BarberStep({ barbers, selectedId, onSelect }: { barbers: BarberItem[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const t = useTranslations("booking");
  return (
    <section data-step={2}>
      <h2 className="mb-3 text-xl font-medium">{t("step2")}</h2>
      <ul className="grid gap-2">
        {barbers.map((b) => {
          const on = selectedId === b.id;
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                aria-pressed={on}
                className={cn(
                  "flex w-full gap-4 rounded-[var(--radius)] border bg-card p-3 text-left transition-colors",
                  on ? "border-primary border-l-4 bg-primary/5" : "border-border hover:border-foreground/40",
                )}
              >
                <Image src={publicUrl(b.photoKey)} alt="" width={72} height={72} className="size-18 shrink-0 rounded-[var(--radius)] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg">{b.name}</span>
                  {b.bio && <span className="block text-sm text-muted-foreground">{b.bio}</span>}
                  {b.recentPhotoKeys.length > 0 && (
                    <span className="mt-2 flex gap-1.5">
                      {b.recentPhotoKeys.map((k) => (
                        <Image key={k} src={publicUrl(k)} alt="" width={40} height={40} className="size-10 rounded-[var(--radius)] object-cover" />
                      ))}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
