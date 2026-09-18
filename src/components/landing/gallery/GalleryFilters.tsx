"use client";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Kategori çipleri: yalnızca etiket adı ve sayı. Şerit dar ekranda yatay kayar
 * (kenarlarda maske, gizli kaydırma çubuğu), geniş ekranda sığdığı kadar satıra
 * yayılır. Seçim `aria-pressed` ile duyurulur; görsel dil sayfanın geri
 * kalanıyla aynı: köşesiz kutular, ince çizgi, seçili olan dolu terracotta.
 */
export function GalleryFilters({
  tags,
  active,
  onSelect,
  counts,
  totalCount,
}: {
  tags: string[];
  active: string | null;
  onSelect: (tag: string | null) => void;
  /** Etiket başına fotoğraf sayısı; "Tümü" burada değil, `totalCount` içinde. */
  counts: Record<string, number>;
  totalCount: number;
}) {
  const t = useTranslations("landing.gallery");
  const items: { key: string; label: string; value: string | null; count: number }[] = [
    { key: "all", label: t("all"), value: null, count: totalCount },
    ...tags.map((t) => ({ key: t, label: t, value: t as string | null, count: counts[t] ?? 0 })),
  ];
  return (
    <div
      role="group"
      aria-label={t("filterLabel")}
      className={cn(
        "mt-8 flex gap-2 overflow-x-auto scroll-smooth pb-1 scrollbar-none",
        "snap-x snap-mandatory",
        "[mask-image:linear-gradient(to_right,transparent,black_14px,black_calc(100%-14px),transparent)]",
        "md:flex-wrap md:overflow-x-visible md:[mask-image:none]",
      )}
    >
      {items.map((item) => {
        const selected = item.value === active;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(item.value)}
            className={cn(
              "flex h-9 shrink-0 snap-start items-center whitespace-nowrap border px-3.5 text-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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
