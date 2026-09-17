import Image from "next/image";
import { ImageSlot } from "@/components/brand/ImageSlot";
import { publicUrl } from "@/lib/storage-public";
import type { PatternVariant } from "@/components/brand/AfroPattern";

const VARIANTS: PatternVariant[] = ["kente", "mud", "tarak"];

export function GallerySection({ photos }: { photos: { id: string; storageKey: string }[] }) {
  const slots = photos.length > 0 ? photos : Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i}`, storageKey: "" }));
  return (
    <section id="galeri" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">GALERİ</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">
            Salonda çekilmiş son kesimler. İsim paylaşmıyoruz, yalnızca işi gösteriyoruz.
          </p>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {slots.map((p, i) => (
            <li key={p.id} className="relative aspect-square overflow-hidden bg-secondary">
              {p.storageKey ? (
                <Image
                  src={publicUrl(p.storageKey)}
                  alt="Salonda yapılmış bir kesim"
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <ImageSlot
                  name={`gallery-${i + 1}.jpg`}
                  alt="Galeri fotoğrafı için ayrılmış alan"
                  variant={VARIANTS[i % VARIANTS.length]}
                  sizes="(min-width: 768px) 25vw, 50vw"
                  label={i === 0 ? "Fotoğraflar yakında" : null}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
