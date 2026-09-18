import { prisma } from "@/lib/db";
import { GALLERY_ORDER } from "@/lib/gallery-order";
import { orderTags } from "@/lib/gallery-tags";
import { buildTagPreviews } from "@/lib/gallery-utils";

import type { GalleryPhoto } from "@/lib/gallery-utils";

export type GalleryPhotoView = GalleryPhoto;

export type GalleryData = {
  photos: GalleryPhotoView[];
  tags: string[];
  /** Etiket → o etiketin çipinde gösterilecek örnek fotoğrafın anahtarı. */
  tagPreviews: Record<string, string>;
};

/**
 * Landing galerisi: yalnızca aktif fotoğraflar, panelde verilen sırayla.
 * Etiket listesi bu fotoğraflardan türetilir; böylece filtrede sonuç vermeyen
 * bir etiket hiç görünmez. Sıra sabit kategori listesinden gelir (`orderTags`),
 * çip görselleri de aynı aktif listeden (`buildTagPreviews`) — ikisi de aynı
 * kaynağa baktığı için çipte görünen kare, çipe basınca ızgarada ilk gelen
 * fotoğrafla aynıdır.
 */
export async function getGalleryData(): Promise<GalleryData> {
  const photos = await prisma.galleryPhoto.findMany({
    where: { isActive: true },
    orderBy: GALLERY_ORDER,
    select: { id: true, storageKey: true, caption: true, tags: true, width: true, height: true },
  });
  const tags = orderTags([...new Set(photos.flatMap((p) => p.tags))]);
  return { photos, tags, tagPreviews: buildTagPreviews(photos) };
}

/** Panel listesi: pasifler dahil, aynı sırayla. */
export async function getPanelGalleryPhotos() {
  return prisma.galleryPhoto.findMany({
    orderBy: GALLERY_ORDER,
    select: { id: true, storageKey: true, caption: true, tags: true, width: true, height: true, isActive: true },
  });
}
