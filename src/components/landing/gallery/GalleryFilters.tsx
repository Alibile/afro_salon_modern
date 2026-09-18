"use client";
import Image from "next/image";
import { publicUrl } from "@/lib/storage-public";
import { cn } from "@/lib/utils";

/**
 * Kategori çipleri. Her çip, o etiketin ilk fotoğrafından alınmış 40px'lik
 * yuvarlak bir kareyle gelir: müşteri "Low Taper Fade" ile "Skin Fade"in ne
 * demek olduğunu okumadan, bakarak ayırt eder. Yuvarlak kare, sayfanın köşesiz
 * kutularının içinde duran tek yuvarlak biçimdir — şeridi ızgaradan ayırır.
 *
 * Şerit dar ekranda yatay kayar (kenarlarda maske, gizli kaydırma çubuğu),
 * geniş ekranda sığdığı kadar satıra yayılır. Seçim `aria-pressed` ile
 * duyurulur; sıralama ve görseller sunucudan hazır gelir.
 */
export function GalleryFilters({
  tags,
  active,
  onSelect,
  counts,
  totalCount,
  previews,
}: {
  tags: string[];
  active: string | null;
  onSelect: (tag: string | null) => void;
  /** Etiket başına fotoğraf sayısı; "Tümü" burada değil, `totalCount` içinde. */
  counts: Record<string, number>;
  totalCount: number;
  /** Etiket → örnek fotoğrafın depo anahtarı. Eksikse çip görselsiz çizilir. */
  previews: Record<string, string>;
}) {
  const items: { key: string; label: string; value: string | null; count: number; preview?: string }[] = [
    { key: "all", label: "Tümü", value: null, count: totalCount },
    ...tags.map((t) => ({
      key: t,
      label: t,
      value: t as string | null,
      count: counts[t] ?? 0,
      preview: previews[t],
    })),
  ];
  return (
    <div
      role="group"
      aria-label="Etikete göre süz"
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
              "flex shrink-0 snap-start items-center gap-2.5 border py-1 text-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              item.preview ? "pl-1 pr-3.5" : "px-4",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {item.preview && (
              <Image
                src={publicUrl(item.preview)}
                alt=""
                width={40}
                height={40}
                sizes="40px"
                className="size-10 shrink-0 rounded-full bg-secondary object-cover"
              />
            )}
            <span className="flex h-10 items-center whitespace-nowrap">
              {item.label}
              <span className="ml-2 text-xs tabular-nums opacity-70">{item.count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
