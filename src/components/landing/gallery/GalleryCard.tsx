import Image from "next/image";
import { publicUrl } from "@/lib/storage-public";
import type { GalleryPhoto } from "@/lib/gallery-utils";

/**
 * Masonry içindeki tek fotoğraf. Sunucu tarafında çalışabilecek kadar sade
 * (yalnızca `next/image`); tıklama davranışını saran istemci bileşeni verir.
 * Fotoğrafın gerçek oranı `width/height` ile korunur, kırpma yapılmaz.
 */
export function GalleryCard({ photo, onSelect }: { photo: GalleryPhoto; onSelect?: () => void }) {
  const label = photo.caption.trim() !== "" ? photo.caption : "Galeri fotoğrafı";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${label} — büyüt`}
      className="group relative block w-full cursor-zoom-in overflow-hidden bg-secondary text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Image
        src={publicUrl(photo.storageKey)}
        alt={label}
        width={photo.width}
        height={photo.height}
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
        className="w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      />
      {photo.caption.trim() !== "" && (
        <span className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-foreground/80 to-transparent px-3 pb-2.5 pt-10 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
          <span className="editorial-note text-sm text-background">{photo.caption}</span>
        </span>
      )}
    </button>
  );
}
