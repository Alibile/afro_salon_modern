/**
 * Salonun işareti: dört eş merkezli üst yarım yay ve altlarında ince bir taban
 * çizgisi — afro tacının siluetiyle tarağın geometrisi aynı çizimde.
 *
 * Geometri tek yerde durur çünkü aynı işaret dört ayrı yerde basılır: React
 * bileşeni (`BrandMark`), `src/app/icon.svg` (statik metadata dosyası),
 * `apple-icon.tsx` ve `opengraph-image.tsx` (ImageResponse, satori düz SVG
 * yerine `<img>` ister — `brandMarkDataUri`). Sayıların dördünde birden aynı
 * kalması için yay listesi ve yol üreteci burada paylaşılır.
 *
 * Renk `currentColor`: işaret bulunduğu bloğun rengini alır, kendi paletini
 * getirmez.
 */

/** Merkez (32,40); yaylar oradan yukarı doğru açılır. */
const CENTER_X = 32;
const BASE_Y = 40;
/** Taban çizgisi yayların uçlarının hemen altında. */
const GROUND_Y = 46;
const GROUND_X1 = 14;
const GROUND_X2 = 50;
const GROUND_WIDTH = 1.25;

/**
 * İçten dışa dört yay. Kalınlık dışa doğru incelir: saç hacmi merkezden
 * uzaklaştıkça açılıyormuş gibi, tek renkle sönen bir his verir.
 */
export const BRAND_ARCS = [
  { r: 6, width: 5.5 },
  { r: 13, width: 4 },
  { r: 20, width: 2.5 },
  { r: 27, width: 1.25 },
] as const;

/**
 * Sol uçtan sağ uca, üstten geçen yarım kavis. SVG'de y aşağı büyüdüğü için
 * "üstten geçmek" saat yönü demektir: `sweep-flag` 1.
 */
export function brandArcPath(r: number): string {
  return `M${CENTER_X - r} ${BASE_Y}A${r} ${r} 0 0 1 ${CENTER_X + r} ${BASE_Y}`;
}

export const BRAND_GROUND_PATH = `M${GROUND_X1} ${GROUND_Y}H${GROUND_X2}`;

/**
 * İşaretin tek başına duran SVG metni. `ImageResponse` (satori) satır içi SVG
 * öğelerini değil `<img>` kaynaklarını çizdiği için gereken budur.
 */
export function brandMarkSvg(color = "currentColor"): string {
  const arcs = BRAND_ARCS.map((a) => `<path d="${brandArcPath(a.r)}" stroke-width="${a.width}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="${color}" stroke-linecap="round">` +
    arcs +
    `<path d="${BRAND_GROUND_PATH}" stroke-width="${GROUND_WIDTH}"/>` +
    `</svg>`
  );
}

/** `brandMarkSvg`in `<img src>` olarak kullanılabilen hâli. */
export function brandMarkDataUri(color: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(brandMarkSvg(color))}`;
}

/**
 * İşaretin React hâli. `title` verilirse erişilebilir bir ad taşır (tek başına
 * bağlantı olduğu yerler); verilmezse dekoratiftir ve `aria-hidden` kalır —
 * yanında zaten yazı markası duruyordur.
 */
export function BrandMark({ size = 32, title, className }: { size?: number; title?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      {title ? <title>{title}</title> : null}
      {BRAND_ARCS.map((a) => (
        <path key={a.r} d={brandArcPath(a.r)} strokeWidth={a.width} />
      ))}
      <path d={BRAND_GROUND_PATH} strokeWidth={GROUND_WIDTH} />
    </svg>
  );
}
