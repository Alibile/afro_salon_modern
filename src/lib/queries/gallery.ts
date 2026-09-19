import { prisma } from "@/lib/db";
import { GALLERY_ORDER } from "@/lib/gallery-order";
import { orderTags } from "@/lib/gallery-tags";
import { asI18nText, pick } from "@/lib/i18n-content";

import type { GalleryPhoto } from "@/lib/gallery-utils";

export type GalleryPhotoView = GalleryPhoto;

export type GalleryData = { photos: GalleryPhotoView[]; tags: string[] };

/**
 * Landing galerisi: yalnızca aktif fotoğraflar, panelde verilen sırayla.
 * Etiket listesi bu fotoğraflardan türetilir; böylece filtrede sonuç vermeyen
 * bir etiket hiç görünmez. Etiket sırası sabit kategori listesinden gelir
 * (`orderTags`); listede olmayan serbest etiketler sona alınır.
 */
export async function getGalleryData(locale: string): Promise<GalleryData> {
  const rows = await prisma.galleryPhoto.findMany({
    where: { isActive: true },
    orderBy: GALLERY_ORDER,
    select: { id: true, storageKey: true, captionI18n: true, tags: true, width: true, height: true },
  });
  // Başlık ziyaretçinin dilinde basılır; etiketler anahtar olarak taşınır ve
  // adlarını basacak bileşen (`tagLabel`) çevirir.
  const photos = rows.map(({ captionI18n, ...p }) => ({ ...p, caption: pick(captionI18n, locale) }));
  const tags = orderTags([...new Set(photos.flatMap((p) => p.tags))]);
  return { photos, tags };
}

/** Panel listesi: pasifler dahil, aynı sırayla. Başlık üç dilde birden döner. */
export async function getPanelGalleryPhotos() {
  const rows = await prisma.galleryPhoto.findMany({
    orderBy: GALLERY_ORDER,
    select: { id: true, storageKey: true, captionI18n: true, tags: true, width: true, height: true, isActive: true },
  });
  return rows.map((p) => ({ ...p, captionI18n: asI18nText(p.captionI18n) }));
}
