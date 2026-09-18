import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AfroPattern, type PatternVariant } from "./AfroPattern";

/**
 * `public/landing/<name>` dosyası varsa fotoğrafı, yoksa desenli bir yer tutucu
 * gösterir. Sunucu bileşenidir (dosya kontrolü `fs` ile yapılır); istemci
 * bileşenlerinden import edilmemelidir. Kendisini saran kutuyu doldurur,
 * bu yüzden çağıran taraf `relative` bir kutu vermelidir.
 *
 * `alt` ve `label` metin alır, anahtar değil: bileşen dosya sistemini bilir,
 * ziyaretçinin dilini değil — çeviriyi çağıran bölüm getirir.
 */
export function ImageSlot({
  name,
  alt,
  className,
  variant = "kente",
  sizes = "100vw",
  priority = false,
  label = null,
}: {
  name: string;
  alt: string;
  className?: string;
  variant?: PatternVariant;
  sizes?: string;
  priority?: boolean;
  label?: string | null;
}) {
  const exists = fs.existsSync(path.join(process.cwd(), "public", "landing", name));
  if (exists) {
    return <Image src={`/landing/${name}`} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  }
  return (
    <div role="img" aria-label={alt} className={cn("absolute inset-0 flex items-end bg-secondary text-primary", className)}>
      <AfroPattern variant={variant} opacity={0.12} size={72} />
      {label && (
        <span className="relative m-3 bg-background/80 px-2 py-1 text-[0.7rem] tracking-wide text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
