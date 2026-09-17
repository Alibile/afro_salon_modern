"use client";
import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { publicUrl } from "@/lib/storage-public";
import { nextIndex, prevIndex, type GalleryPhoto } from "@/lib/gallery-utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** Parmakla kaydırmanın fotoğraf değiştirmesi için gereken en küçük yatay mesafe. */
const SWIPE_THRESHOLD = 40;

export function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: GalleryPhoto[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const open = index !== null;
  const startX = useRef<number | null>(null);

  const go = useCallback(
    (direction: "next" | "prev") => {
      if (index === null) return;
      onIndexChange(direction === "next" ? nextIndex(index, photos.length) : prevIndex(index, photos.length));
    },
    [index, photos.length, onIndexChange],
  );

  // ←/→ her yerden çalışır; Esc'i Dialog'un kendisi yönetir.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go("prev");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, go]);

  if (index === null) return null;
  const photo = photos[index];
  if (!photo) return null;
  const label = photo.caption.trim() !== "" ? photo.caption : "Galeri fotoğrafı";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-label="Galeri fotoğrafı"
        className="fixed inset-0 top-0 left-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-background p-0 ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">
          Sol ve sağ ok tuşlarıyla fotoğraflar arasında gezinebilir, Esc ile kapatabilirsin.
        </DialogDescription>

        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <p className="font-display text-2xl tracking-wide tabular-nums">
            {index + 1} / {photos.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-10 items-center justify-center border border-border transition-colors hover:border-foreground"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center bg-secondary/40 px-2 py-3 md:px-16"
          onPointerDown={(e) => {
            startX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (startX.current === null) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) >= SWIPE_THRESHOLD) go(dx < 0 ? "next" : "prev");
          }}
          onPointerCancel={() => {
            startX.current = null;
          }}
        >
          <Image
            key={photo.id}
            src={publicUrl(photo.storageKey)}
            alt={label}
            width={photo.width}
            height={photo.height}
            sizes="100vw"
            priority
            draggable={false}
            className="max-h-full w-auto max-w-full border border-border object-contain select-none"
          />
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go("prev")}
                aria-label="Önceki fotoğraf"
                className="absolute left-2 flex size-11 items-center justify-center border border-border bg-background/85 transition-colors hover:border-foreground md:left-4"
              >
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go("next")}
                aria-label="Sonraki fotoğraf"
                className="absolute right-2 flex size-11 items-center justify-center border border-border bg-background/85 transition-colors hover:border-foreground md:right-4"
              >
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </>
          )}
        </div>

        <div className="border-t border-border px-4 py-4 md:px-6">
          {photo.caption.trim() !== "" && <p className="editorial-note text-lg">{photo.caption}</p>}
          {photo.tags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {photo.tags.map((t) => (
                <li key={t} className="border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
