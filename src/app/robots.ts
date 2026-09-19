import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { withLocale } from "@/lib/locale-path";
import { siteUrl } from "@/lib/site-url";

/**
 * Oturum gerektiren ya da dizine girmesi anlamsız yollar. Üç dilde de aynı
 * ağaç var (`/panel`, `/en/panel`, `/fr/panel`), bu yüzden liste dil dil
 * açılır; `/api` dil önekinden bağımsızdır, `[locale]` altına taşınmadı.
 */
const PRIVATE_PATHS = ["/panel", "/randevularim", "/giris", "/kayit"];

/**
 * `robots.txt` de site haritası gibi `src/app/` kökünde: `[locale]` segmenti
 * onu tanımaz, proxy matcher'ı uzantılı yolu zaten dışarıda bırakır.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api", ...routing.locales.flatMap((locale) => PRIVATE_PATHS.map((path) => withLocale(locale, path)))],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
