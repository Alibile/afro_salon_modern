import { ImageResponse } from "next/og";
import { brandMarkDataUri } from "@/components/brand/BrandMark";

/**
 * iOS ana ekran ikonu. `.png` dosyası yerine kodla üretilir: işaretin
 * geometrisi tek yerde (`BrandMark`) durur, ikon da ondan beslenir — çizim
 * değişirse elle yeniden dışa aktarılacak bir dosya kalmaz.
 *
 * Renkler burada sabittir (`--primary` / `--hero-sand` karşılıkları): ikon
 * ana ekranda basılır, sayfanın CSS değişkenlerini okuyamaz. Zemin de şeffaf
 * değil dolu: iOS saydam ikonları siyaha basar.
 *
 * `ImageResponse` satır içi SVG öğelerini çizmez, `<img>` kaynaklarını çizer;
 * işaret bu yüzden veri URI'si olarak geçirilir.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BACKGROUND = "#cf6139";
const MARK = "#fcf4e6";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
        }}
      >
        {/* `next/image` değil düz `<img>`: ImageResponse (satori) yalnızca bunu çizer. */}
        <img src={brandMarkDataUri(MARK)} alt="" width={140} height={140} style={{ marginTop: -14 }} />
      </div>
    ),
    { ...size },
  );
}
