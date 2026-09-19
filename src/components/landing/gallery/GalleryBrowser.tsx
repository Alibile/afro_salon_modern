"use client";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { filterByTag, paginate, GALLERY_PAGE_SIZE, type GalleryPhoto } from "@/lib/gallery-utils";
import { tagLabel } from "@/lib/gallery-tags";
import { GalleryFilters } from "./GalleryFilters";
import { MasonryGrid } from "./MasonryGrid";
import { Lightbox } from "./Lightbox";

/**
 * Galerinin istemci tarafı: etiket filtresi (URL'de `?etiket=<anahtar>`;
 * anahtar dile göre değişmediği için bağlantı üç dilde de aynı fotoğrafları
 * açar), "daha fazla
 * göster" sayfalaması ve lightbox durumu burada tutulur. Seçim önce yerel
 * durumda uygulanır (anında tepki), URL'ye yalnızca paylaşılabilirlik için yazılır.
 */
export function GalleryBrowser({ photos, tags }: { photos: GalleryPhoto[]; tags: string[] }) {
  const t = useTranslations("landing.gallery");
  const tTag = useTranslations("gallery.tags");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTag = searchParams.get("etiket");
  const validUrlTag = urlTag && tags.includes(urlTag) ? urlTag : null;

  // Seçili etiketin kaynağı URL'dir (paylaşılabilir, geri/ileri ile çalışır);
  // `useOptimistic` yalnızca sunucu turunu beklerken arayüzü anında günceller.
  const [active, setActiveOptimistic] = useOptimistic(validUrlTag);
  const [, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // "Tümü" sayısı etiket sayılarından ayrı taşınır: sihirli bir anahtar
  // (`__all`) bir gün gerçek bir etiketle çakışabilirdi.
  const tagCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const tag of tags) c[tag] = filterByTag(photos, tag).length;
    return c;
  }, [photos, tags]);

  const filtered = useMemo(() => filterByTag(photos, active), [photos, active]);
  const visible = paginate(filtered, page, GALLERY_PAGE_SIZE);
  const remaining = filtered.length - visible.length;

  /**
   * Lightbox filtrelenmiş listenin tamamında gezinir, yalnızca basılı sayfada
   * değil: 12. fotoğraftan sonra ok tuşu başa dönmek yerine 13.'ye geçer ve
   * gerideki ızgara da o fotoğrafı kapsayacak kadar açılır.
   */
  function showIndex(index: number) {
    setOpenIndex(index);
    setPage((p) => Math.max(p, Math.ceil((index + 1) / GALLERY_PAGE_SIZE)));
  }

  function selectTag(tag: string | null) {
    setPage(1);
    setOpenIndex(null);
    const params = new URLSearchParams(searchParams.toString());
    if (tag) params.set("etiket", tag);
    else params.delete("etiket");
    const query = params.toString();
    startTransition(() => {
      setActiveOptimistic(tag);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <>
      <GalleryFilters tags={tags} active={active} onSelect={selectTag} counts={tagCounts} totalCount={photos.length} />

      <div className="mt-8">
        <MasonryGrid photos={visible} onSelect={showIndex} />
      </div>

      <p aria-live="polite" className="sr-only">
        {active ? t("countWithTag", { tag: tagLabel(active, tTag), count: filtered.length }) : t("count", { count: filtered.length })}
      </p>

      {remaining > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="border border-foreground/30 px-6 py-3 transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
          >
            {t("showMore", { remaining })}
          </button>
        </div>
      )}

      <Lightbox photos={filtered} index={openIndex} onIndexChange={showIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}
