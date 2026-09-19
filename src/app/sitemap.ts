import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { withLocale } from "@/lib/locale-path";
import { localeAlternates, PUBLIC_PATHS } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

/**
 * Site haritası `[locale]` ağacının **dışında**, `src/app/` kökünde durur:
 * `/sitemap.xml` bir dil segmenti değildir ve `[locale]/layout.tsx` onu 404'e
 * düşürürdü. Proxy de uzantılı yolları matcher dışında bırakır
 * (`src/proxy.ts`), yani dosya dil yönlendirmesine hiç girmez.
 *
 * Salon tek bir açılış sayfasından ibaret: dinamik içerik sayfası yok, o
 * yüzden liste `PUBLIC_PATHS` üzerinden sabittir. Her yol üç kez listelenir
 * (her dil ayrı bir adres) ve her kayıt öbür iki dile `alternates` ile
 * bağlanır — Google aynı sayfanın çevirilerini böyle eşler.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();
  return PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${base}${withLocale(locale, path)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
      alternates: { languages: localeAlternates(path, base) },
    })),
  );
}
