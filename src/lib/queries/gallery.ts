import { prisma } from "@/lib/db";
import { GALLERY_ORDER } from "@/lib/gallery-order";

import type { GalleryPhoto } from "@/lib/gallery-utils";

export type GalleryPhotoView = GalleryPhoto;

export type GalleryData = { photos: GalleryPhotoView[]; tags: string[] };

/**
 * Landing galerisi: yalnızca aktif fotoğraflar, panelde verilen sırayla.
 * Etiket listesi bu fotoğraflardan türetilir; böylece filtrede sonuç vermeyen
 * bir etiket hiç görünmez.
 */
export async function getGalleryData(): Promise<GalleryData> {
  const photos = await prisma.galleryPhoto.findMany({
    where: { isActive: true },
    orderBy: GALLERY_ORDER,
    select: { id: true, storageKey: true, caption: true, tags: true, width: true, height: true },
  });
  const tags = [...new Set(photos.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, "tr"));
  return { photos, tags };
}

/** Panel listesi: pasifler dahil, aynı sırayla. */
export async function getPanelGalleryPhotos() {
  return prisma.galleryPhoto.findMany({
    orderBy: GALLERY_ORDER,
    select: { id: true, storageKey: true, caption: true, tags: true, width: true, height: true, isActive: true },
  });
}
