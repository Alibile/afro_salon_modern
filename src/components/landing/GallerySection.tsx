import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { ImageSlot } from "@/components/brand/ImageSlot";
import type { PatternVariant } from "@/components/brand/AfroPattern";
import type { GalleryPhoto } from "@/lib/gallery-utils";
import { Reveal } from "@/components/motion/Reveal";
import { GalleryBrowser } from "./gallery/GalleryBrowser";

const VARIANTS: PatternVariant[] = ["kente", "mud", "tarak"];

/** Panelde hiç fotoğraf yoksa bölüm boş kalmaz: desenli yer tutucular durur. */
function PatternPlaceholder({ alt, label }: { alt: string; label: string }) {
  return (
    <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="relative aspect-square overflow-hidden bg-secondary">
          <ImageSlot
            name={`gallery-${i + 1}.jpg`}
            alt={alt}
            variant={VARIANTS[i % VARIANTS.length]}
            sizes="(min-width: 768px) 25vw, 50vw"
            label={i === 0 ? label : null}
          />
        </li>
      ))}
    </ul>
  );
}

export function GallerySection({ photos, tags }: { photos: GalleryPhoto[]; tags: string[] }) {
  const t = useTranslations("landing.gallery");
  return (
    <section id="galeri" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">{t("note")}</p>
        </Reveal>
        {photos.length === 0 ? (
          <PatternPlaceholder alt={t("placeholderAlt")} label={t("photosSoon")} />
        ) : (
          <Suspense fallback={<div className="mt-8 h-96" aria-hidden />}>
            <GalleryBrowser photos={photos} tags={tags} />
          </Suspense>
        )}
      </div>
    </section>
  );
}
