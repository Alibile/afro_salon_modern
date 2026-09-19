import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { brandMarkDataUri } from "@/components/brand/BrandMark";
import { toAppLocale } from "@/i18n/routing";

/**
 * Bağlantı paylaşıldığında görünen kart. `[locale]` segmentinin altında durur,
 * yani üç dilde üç ayrı görsel üretilir: başlık altındaki cümle ziyaretçinin
 * (daha doğrusu paylaşılan adresin) dilindeki `meta.home.description`tır.
 *
 * Next bu dosyayı sayfa metadata'sına kendisi bağlar (`openGraph.images`);
 * `generateMetadata` içinde ayrıca yazılmaz.
 *
 * Yazı yüzü bilinçli olarak `ImageResponse`in kendi varsayılanıdır: Fraunces'i
 * buraya taşımak, kartı üretmek için ayrıca bir yazı tipi dosyası okumak
 * demekti ve derleme zamanına ağ isteği sokardı. Kartın kimliğini işaret ve
 * renkler taşıyor.
 */
export const alt = "Afro Salon Modern";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#1e130e";
const SAND = "#fcf4e6";
const TERRACOTTA = "#cf6139";

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = toAppLocale((await params).locale);
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "meta.home" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          color: SAND,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* `next/image` değil düz `<img>`: ImageResponse (satori) yalnızca bunu çizer. */}
          <img src={brandMarkDataUri(TERRACOTTA)} alt="" width={120} height={120} />
          <span style={{ fontSize: 56, letterSpacing: "0.01em" }}>{tCommon("brand")}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <span style={{ height: 6, width: 160, background: TERRACOTTA }} />
          <span style={{ fontSize: 40, lineHeight: 1.3, maxWidth: 940, color: SAND }}>{t("description")}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
