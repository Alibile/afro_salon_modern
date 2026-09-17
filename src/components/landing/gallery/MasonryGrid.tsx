"use client";
import type { GalleryPhoto } from "@/lib/gallery-utils";
import { GalleryCard } from "./GalleryCard";

/**
 * CSS sütunlarıyla masonry: satır hizası yoktur, her fotoğraf kendi oranını
 * korur ve sütunlar ekran genişliğine göre 2 → 3 → 4'e çıkar.
 */
export function MasonryGrid({ photos, onSelect }: { photos: GalleryPhoto[]; onSelect: (index: number) => void }) {
  return (
    <ul className="columns-2 gap-3 md:columns-3 xl:columns-4">
      {photos.map((photo, i) => (
        <li key={photo.id} className="mb-3 break-inside-avoid">
          <GalleryCard photo={photo} onSelect={() => onSelect(i)} />
        </li>
      ))}
    </ul>
  );
}
