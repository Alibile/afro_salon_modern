import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Proxy (middleware) URL'leri next-intl'in `Link`/`redirect` sarmalayıcılarından
 * önce görür: `/en/panel` henüz `/panel` değildir. Yetki kuralları yolun kendisine
 * bakar, dile değil; bu yüzden önek burada bir kez soyulur, üretilen yönlendirme
 * adresine yine burada geri eklenir.
 *
 * Türkçe öneksiz olduğundan (`localePrefix: "as-needed"`) `withLocale("tr", …)`
 * yolu olduğu gibi döner.
 */
export type StrippedPath = { locale: AppLocale; path: string };

const PREFIXED = routing.locales.filter((l) => l !== routing.defaultLocale);

export function stripLocale(pathname: string): StrippedPath {
  for (const locale of PREFIXED) {
    const prefix = `/${locale}`;
    if (pathname === prefix) return { locale, path: "/" };
    if (pathname.startsWith(`${prefix}/`)) return { locale, path: pathname.slice(prefix.length) };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

export function withLocale(locale: AppLocale, path: string): string {
  if (locale === routing.defaultLocale) return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}
