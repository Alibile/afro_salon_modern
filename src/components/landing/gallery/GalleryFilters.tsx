"use client";
import { cn } from "@/lib/utils";

/**
 * Etiket filtresi. Seçim `aria-pressed` ile duyurulur; görsel dil sayfanın
 * geri kalanıyla aynı: köşesiz kutular, ince çizgi, seçili olan dolu terracotta.
 */
export function GalleryFilters({
  tags,
  active,
  onSelect,
  counts,
}: {
  tags: string[];
  active: string | null;
  onSelect: (tag: string | null) => void;
  counts: Record<string, number>;
}) {
  const items: { key: string; label: string; value: string | null; count: number }[] = [
    { key: "all", label: "Tümü", value: null, count: counts.__all ?? 0 },
    ...tags.map((t) => ({ key: t, label: t, value: t as string | null, count: counts[t] ?? 0 })),
  ];
  return (
    <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Etikete göre süz">
      {items.map((item) => {
        const selected = item.value === active;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(item.value)}
            className={cn(
              "border px-3.5 py-1.5 text-sm transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {item.label}
            <span className="ml-2 text-xs tabular-nums opacity-70">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
