"use client";
import { distributeColumns, type GalleryPhoto } from "@/lib/gallery-utils";
import { GalleryCard } from "./GalleryCard";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/lib/motion-utils";
import { cn } from "@/lib/utils";

/**
 * Masonry: her fotoğraf kendi oranını korur, satır hizası yoktur. Sütunlar CSS
 * `columns-*` ile değil, JS ile dolaşımlı dağıtılır; CSS sütunları bir sütunu
 * doldurup diğerine geçtiği için panelde verilen sıra ekranda yukarıdan aşağı
 * okunurdu. Dağıtım sunucuda da yapılabildiği için üç kırılım (2/3/4 sütun)
 * ayrı ayrı basılır ve yalnızca biri görünür — böylece ilk boyamada doğru düzen
 * gelir, ekran genişliğini ölçmek için istemciye ihtiyaç kalmaz.
 */
const BREAKPOINTS = [
  { columns: 2, className: "md:hidden" },
  { columns: 3, className: "hidden md:flex xl:hidden" },
  { columns: 4, className: "hidden xl:flex" },
];

export function MasonryGrid({ photos, onSelect }: { photos: GalleryPhoto[]; onSelect: (index: number) => void }) {
  // Lightbox özgün listedeki sırayı kullanır; sütuna dağıtırken indeks taşınır.
  const entries = photos.map((photo, index) => ({ photo, index }));
  return (
    <>
      {BREAKPOINTS.map(({ columns, className }) => (
        <div key={columns} className={cn("flex gap-4", className)}>
          {distributeColumns(entries, columns).map((column, columnIndex) => (
            <ul key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-4">
              {/* Gecikme sütun içindeki sıraya bakar; `index` lightbox eşlemesi için olduğu gibi kalır. */}
              {column.map(({ photo, index }, positionInColumn) => (
                <Reveal as="li" key={photo.id} delay={staggerDelay(positionInColumn, 0.05)}>
                  <GalleryCard photo={photo} onSelect={() => onSelect(index)} />
                </Reveal>
              ))}
            </ul>
          ))}
        </div>
      ))}
    </>
  );
}
