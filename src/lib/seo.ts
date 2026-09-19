import type { Metadata } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { withLocale } from "@/lib/locale-path";

/**
 * Arama motorlarına açık sayfalar. Site haritası ve dil bağlantıları aynı
 * listeden beslenir: yeni bir herkese açık sayfa eklendiğinde tek yer
 * güncellenir. Panel, hesap sayfaları ve giriş/kayıt burada yoktur — onlar
 * `robots: { index: false }` taşır (bkz. ilgili `layout.tsx`/`page.tsx`).
 */
export const PUBLIC_PATHS = ["/", "/randevu"] as const;

/**
 * Bir sayfanın üç dildeki adresleri. Dönen nesnenin tipi `AppLocale`'e bağlı:
 * `routing.locales`'e dördüncü bir dil eklenirse burası derlemede kırılır ve
 * hreflang listesi sessizce eksik kalmaz.
 *
 * `x-default` varsayılan dile (Türkçe, öneksiz) gider: dili eşleşmeyen
 * ziyaretçi salonun kendi diline düşer.
 *
 * `base` verilmezse yollar göreli döner — sayfa metadata'sında `metadataBase`
 * zaten mutlaklaştırır. Site haritasının `metadataBase`'i yoktur, o yüzden
 * oradan `siteUrl()` geçilir.
 */
export function localeAlternates(path: string, base = ""): Record<AppLocale | "x-default", string> {
  const href = (locale: AppLocale) => `${base}${withLocale(locale, path)}`;
  return {
    tr: href("tr"),
    en: href("en"),
    fr: href("fr"),
    "x-default": href(routing.defaultLocale),
  };
}

/**
 * Sayfa metadata'sına doğrudan verilebilen `alternates` bloğu: o dildeki
 * kendi adresi `canonical`, üç dil + `x-default` ise `languages`.
 */
export function pageAlternates(path: string, locale: AppLocale) {
  return { canonical: withLocale(locale, path), languages: localeAlternates(path) };
}

/**
 * Oturum ardındaki ya da dizine girmesi anlamsız sayfaların metadata'sı.
 * Yerleşime konduğunda altındaki tüm sayfalara iner (`/panel/**`), sayfaya
 * konduğunda yalnızca o sayfaya. `robots.txt` taramayı engeller, bu etiket ise
 * bağlantıyla gelip yine de taranan bir sayfanın dizine girmesini engeller —
 * ikisi birbirinin yerine geçmez.
 */
export const noIndex: Metadata = { robots: { index: false } };
